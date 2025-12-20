export interface WatermarkSettings {
    type: 'text' | 'image'
    text: string
    font: string
    fontSize: number
    color: string
    image: HTMLImageElement | null
    imageScale: number
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'
    customX: number
    customY: number
    isTiled: boolean
    tileGap: number
    rotation: number
}

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
    type: 'text',
    text: 'Watermark',
    font: 'Arial',
    fontSize: 5, // Now represents % of image width
    color: '#ffffff',
    image: null,
    imageScale: 20, // % of base image width
    opacity: 0.5,
    position: 'center',
    customX: 0,
    customY: 0,
    isTiled: false,
    tileGap: 50,
    rotation: 0
}

export function drawWatermark(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    baseImage: HTMLImageElement,
    settings: WatermarkSettings
) {
    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.globalAlpha = settings.opacity

    if (settings.isTiled) {
        drawTiledWatermark(ctx, canvas, settings)
    } else {
        drawSingleWatermark(ctx, canvas, settings)
    }

    ctx.restore()
}

function drawSingleWatermark(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    settings: WatermarkSettings
) {
    let x = 0
    let y = 0
    let w = 0
    let h = 0

    if (settings.type === 'text') {
        const fontSizePx = (canvas.width * settings.fontSize) / 100
        ctx.font = `bold ${fontSizePx}px ${settings.font}`
        ctx.fillStyle = settings.color
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        const metrics = ctx.measureText(settings.text)
        w = metrics.width
        h = fontSizePx // Approx
    } else if (settings.type === 'image' && settings.image) {
        // Scale relative to base image width if possible, or just use raw scale
        // Let's interpret imageScale as % of base image width for better UX
        const targetWidth = canvas.width * (settings.imageScale / 100)
        const ratio = settings.image.height / settings.image.width
        w = targetWidth
        h = targetWidth * ratio
    }

    // Calculate Position
    if (settings.position === 'custom') {
        x = settings.customX + canvas.width / 2
        y = settings.customY + canvas.height / 2
    } else {
        const padding = 20 + Math.max(w, h) / 2 // Add extra padding for rotation safety
        switch (settings.position) {
            case 'center':
                x = canvas.width / 2
                y = canvas.height / 2
                break
            case 'top-left':
                x = padding
                y = padding
                break
            case 'top-right':
                x = canvas.width - padding
                y = padding
                break
            case 'bottom-left':
                x = padding
                y = canvas.height - padding
                break
            case 'bottom-right':
                x = canvas.width - padding
                y = canvas.height - padding
                break
        }
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(settings.rotation * Math.PI / 180)

    // Draw
    if (settings.type === 'text') {
        ctx.fillText(settings.text, 0, 0)
    } else if (settings.type === 'image' && settings.image) {
        ctx.drawImage(settings.image, -w / 2, -h / 2, w, h)
    }
    ctx.restore()
}

function drawTiledWatermark(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    settings: WatermarkSettings
) {
    // Create a pattern canvas
    const pCanvas = document.createElement('canvas')
    const pCtx = pCanvas.getContext('2d')
    if (!pCtx) return

    let w = 0
    let h = 0

    if (settings.type === 'text') {
        pCtx.font = `bold ${settings.fontSize}px ${settings.font}`
        const metrics = pCtx.measureText(settings.text)
        w = metrics.width + settings.tileGap
        h = settings.fontSize + settings.tileGap
        pCanvas.width = w
        pCanvas.height = h

        pCtx.font = `bold ${settings.fontSize}px ${settings.font}`
        pCtx.fillStyle = settings.color
        pCtx.textBaseline = 'middle'
        pCtx.textAlign = 'center'

        // Rotate text slightly for better tiled look? Maybe optional.
        pCtx.translate(w / 2, h / 2)
        pCtx.rotate((settings.rotation - 30) * Math.PI / 180) // Default -30 plus user rotation
        pCtx.fillText(settings.text, 0, 0)

    } else if (settings.type === 'image' && settings.image) {
        // Scale relative to canvas width
        const imgW = canvas.width * (settings.imageScale / 100)
        const ratio = settings.image.height / settings.image.width
        const imgH = imgW * ratio

        w = imgW + settings.tileGap
        h = imgH + settings.tileGap
        pCanvas.width = w
        pCanvas.height = h

        pCtx.translate(w / 2, h / 2)
        pCtx.rotate((settings.rotation - 30) * Math.PI / 180)
        pCtx.drawImage(settings.image, -imgW / 2, -imgH / 2, imgW, imgH)
    }

    const pattern = ctx.createPattern(pCanvas, 'repeat')
    if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
}
