export interface ConversionSettings {
    format: 'image/png' | 'image/jpeg' | 'image/webp'
    quality: number // 0-100
    width?: number
    height?: number
    maintainAspectRatio: boolean
    backgroundColor: string
}

export interface ImageFile {
    file: File
    img: HTMLImageElement
    name: string
}

export async function convertImage(
    imageFile: ImageFile,
    settings: ConversionSettings
): Promise<Blob> {
    const { img } = imageFile
    const { format, quality, width, height, maintainAspectRatio, backgroundColor } = settings

    // Calculate dimensions
    let targetWidth = width || img.width
    let targetHeight = height || img.height

    if (maintainAspectRatio && (width || height)) {
        const aspectRatio = img.width / img.height
        if (width && !height) {
            targetWidth = width
            targetHeight = width / aspectRatio
        } else if (height && !width) {
            targetHeight = height
            targetWidth = height * aspectRatio
        } else if (width && height) {
            // Use width as primary constraint
            targetWidth = width
            targetHeight = width / aspectRatio
        }
    }

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Fill background if not PNG (for transparency handling)
    if (format !== 'image/png') {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, targetWidth, targetHeight)
    }

    // Draw image
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Failed to convert image'))
                }
            },
            format,
            quality / 100
        )
    })
}

export function getImageDimensions(img: HTMLImageElement): { width: number; height: number } {
    return {
        width: img.width,
        height: img.height
    }
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function getFormatExtension(format: string): string {
    switch (format) {
        case 'image/png':
            return 'png'
        case 'image/jpeg':
            return 'jpg'
        case 'image/webp':
            return 'webp'
        default:
            return 'png'
    }
}

export function downloadImage(blob: Blob, filename: string, format: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const ext = getFormatExtension(format)
    const baseName = filename.split('.')[0]
    link.download = `${baseName}_converted.${ext}`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
}

export async function downloadBatch(
    images: ImageFile[],
    settings: ConversionSettings
): Promise<void> {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    for (const imageFile of images) {
        const blob = await convertImage(imageFile, settings)
        const ext = getFormatExtension(settings.format)
        const baseName = imageFile.name.split('.')[0]
        zip.file(`${baseName}_converted.${ext}`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const link = document.createElement('a')
    link.download = 'converted_images.zip'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
}
