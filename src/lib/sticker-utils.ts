export interface StickerSettings {
    offset: number
    color: string
}

export function drawSticker(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    settings: StickerSettings
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const imgX = Math.floor((canvas.width - img.width) / 2)
    const imgY = Math.floor((canvas.height - img.height) / 2)

    if (settings.offset > 0) {
        const mask = document.createElement('canvas')
        mask.width = canvas.width
        mask.height = canvas.height
        const mCtx = mask.getContext('2d')
        if (!mCtx) return

        mCtx.drawImage(img, imgX, imgY)
        mCtx.globalCompositeOperation = 'source-in'
        mCtx.fillStyle = settings.color
        mCtx.fillRect(0, 0, mask.width, mask.height)

        ctx.save()
        // Draw the border by rotating the mask
        for (let i = 0; i < 72; i++) {
            const a = (i / 72) * Math.PI * 2
            ctx.drawImage(
                mask,
                Math.cos(a) * settings.offset,
                Math.sin(a) * settings.offset
            )
        }
        ctx.restore()
    }

    ctx.drawImage(img, imgX, imgY)
}
