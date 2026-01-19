
export interface LaserSettings {
    algorithm: 'threshold' | 'floyd-steinberg' | 'atkinson' | 'burkes' | 'sierra' | 'halftone'
    threshold: number // 0-255
    brightness: number // -100 to 100
    contrast: number // -100 to 100
    inverted: boolean
    scale: number // 0.1 to 1.0 (downsampling before processing for performance/style)
    gridSize: number // Only for halftone
}

export const DEFAULT_LASER_SETTINGS: LaserSettings = {
    algorithm: 'atkinson',
    threshold: 128,
    brightness: 0,
    contrast: 0,
    inverted: false,
    scale: 1,
    gridSize: 6
}

export async function processForLaser(
    imageData: ImageData,
    settings: LaserSettings
): Promise<ImageData> {
    // Create a copy to avoid mutating original
    const width = imageData.width
    const height = imageData.height
    const newImageData = new ImageData(
        new Uint8ClampedArray(imageData.data),
        width,
        height
    )
    const data = newImageData.data

    // 1. Pre-processing: Grayscale + Brightness + Contrast used for calculation
    // We will do this pixel by pixel or in a pass

    // Helper to get index
    const idx = (x: number, y: number) => (y * width + x) * 4

    // Apply adjustments to a buffer first (grayscale definition)
    const grayBuffer = new Float32Array(width * height)

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // Standard luminance
        let gray = 0.299 * r + 0.587 * g + 0.114 * b

        // Brightness
        gray += settings.brightness * 2.55

        // Contrast
        const factor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
        gray = factor * (gray - 128) + 128

        // Clamp
        gray = Math.max(0, Math.min(255, gray))

        // Invert if needed
        if (settings.inverted) {
            gray = 255 - gray
        }

        grayBuffer[i / 4] = gray
    }

    // 2. Dithering / Thresholding
    if (settings.algorithm === 'threshold') {
        for (let i = 0; i < grayBuffer.length; i++) {
            const val = grayBuffer[i] >= settings.threshold ? 255 : 0
            const pixelIdx = i * 4
            data[pixelIdx] = val     // R
            data[pixelIdx + 1] = val // G
            data[pixelIdx + 2] = val // B
            data[pixelIdx + 3] = 255 // A
        }
    } else if (settings.algorithm !== 'halftone') {
        // Error Diffusion Algorithms
        // We use the grayBuffer to propagate errors

        const distributeError = (x: number, y: number, error: number, weight: number) => {
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const i = y * width + x
                grayBuffer[i] += error * weight
            }
        }

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = y * width + x
                const oldPixel = grayBuffer[i]
                const newPixel = oldPixel < 128 ? 0 : 255
                grayBuffer[i] = newPixel
                const quantError = oldPixel - newPixel

                const pixelIdx = i * 4
                data[pixelIdx] = newPixel
                data[pixelIdx + 1] = newPixel
                data[pixelIdx + 2] = newPixel
                data[pixelIdx + 3] = 255

                // Error Distibution
                if (settings.algorithm === 'floyd-steinberg') {
                    distributeError(x + 1, y, quantError, 7 / 16)
                    distributeError(x - 1, y + 1, quantError, 3 / 16)
                    distributeError(x, y + 1, quantError, 5 / 16)
                    distributeError(x + 1, y + 1, quantError, 1 / 16)
                }
                else if (settings.algorithm === 'atkinson') {
                    distributeError(x + 1, y, quantError, 1 / 8)
                    distributeError(x + 2, y, quantError, 1 / 8)
                    distributeError(x - 1, y + 1, quantError, 1 / 8)
                    distributeError(x, y + 1, quantError, 1 / 8)
                    distributeError(x + 1, y + 1, quantError, 1 / 8)
                    distributeError(x, y + 2, quantError, 1 / 8)
                }
                else if (settings.algorithm === 'burkes') {
                    distributeError(x + 1, y, quantError, 8 / 32)
                    distributeError(x + 2, y, quantError, 4 / 32)
                    distributeError(x - 2, y + 1, quantError, 2 / 32)
                    distributeError(x - 1, y + 1, quantError, 4 / 32)
                    distributeError(x, y + 1, quantError, 8 / 32)
                    distributeError(x + 1, y + 1, quantError, 4 / 32)
                    distributeError(x + 2, y + 1, quantError, 2 / 32)
                }
                else if (settings.algorithm === 'sierra') {
                    distributeError(x + 1, y, quantError, 5 / 32)
                    distributeError(x + 2, y, quantError, 3 / 32)
                    distributeError(x - 2, y + 1, quantError, 2 / 32)
                    distributeError(x - 1, y + 1, quantError, 4 / 32)
                    distributeError(x, y + 1, quantError, 5 / 32)
                    distributeError(x + 1, y + 1, quantError, 4 / 32)
                    distributeError(x + 2, y + 1, quantError, 2 / 32)
                    distributeError(x - 1, y + 2, quantError, 2 / 32)
                    distributeError(x, y + 2, quantError, 3 / 32)
                    distributeError(x + 1, y + 2, quantError, 2 / 32)
                }
            }
        }
    }

    if (settings.algorithm === 'halftone') {
        const size = settings.gridSize || 6
        for (let y = 0; y < height; y += size) {
            for (let x = 0; x < width; x += size) {
                // Calculate average brightness of the cell
                let sum = 0
                let count = 0
                for (let sy = 0; sy < size; sy++) {
                    for (let sx = 0; sx < size; sx++) {
                        const px = x + sx
                        const py = y + sy
                        if (px < width && py < height) {
                            sum += grayBuffer[py * width + px]
                            count++
                        }
                    }
                }
                const avg = sum / count

                // Radius based on darkness (inverted logic: darker = larger circle)
                // avg: 0 (black) -> radius: size/2
                // avg: 255 (white) -> radius: 0
                const maxRadius = size / 2 * 1.2 // slight overlap
                const radius = ((255 - avg) / 255) * maxRadius

                const centerX = x + size / 2
                const centerY = y + size / 2

                // Draw Circle in the cell
                for (let sy = 0; sy < size; sy++) {
                    for (let sx = 0; sx < size; sx++) {
                        const px = x + sx
                        const py = y + sy
                        if (px < width && py < height) {
                            const dx = px - centerX
                            const dy = py - centerY
                            const dist = Math.sqrt(dx * dx + dy * dy)

                            let val = 255
                            if (dist <= radius) {
                                val = 0
                            }

                            const idx = (py * width + px) * 4
                            data[idx] = val
                            data[idx + 1] = val
                            data[idx + 2] = val
                            data[idx + 3] = 255
                        }
                    }
                }
            }
        }
    }

    return newImageData
}
