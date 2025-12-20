export interface PassportStandard {
    id: string
    label: string
    widthMm: number
    heightMm: number
    headMinPercent: number // Min head height %
    headMaxPercent: number // Max head height %
    topMarginPercent: number // Approx top margin %
    description: string
}

export const PASSPORT_STANDARDS: PassportStandard[] = [
    {
        id: 'us',
        label: 'US Passport (2x2")',
        widthMm: 51, // 2 inches
        heightMm: 51,
        headMinPercent: 0.50, // 1 inch
        headMaxPercent: 0.69, // 1.375 inch
        topMarginPercent: 0.10,
        description: '51x51mm. Head must be between 25-35mm from bottom of chin to top of head.'
    },
    {
        id: 'uk_eu',
        label: 'UK/EU (35x45mm)',
        widthMm: 35,
        heightMm: 45,
        headMinPercent: 0.70, // 29mm
        headMaxPercent: 0.80, // 34mm
        topMarginPercent: 0.08,
        description: '35x45mm. Standard for most European countries.'
    },
    {
        id: 'in',
        label: 'India Passport (2x2")',
        widthMm: 51,
        heightMm: 51,
        headMinPercent: 0.50,
        headMaxPercent: 0.69,
        topMarginPercent: 0.10,
        description: '51x51mm. Similar to US standard.'
    },
    {
        id: 'jp',
        label: 'Japan (35x45mm)',
        widthMm: 35,
        heightMm: 45,
        headMinPercent: 0.70,
        headMaxPercent: 0.80,
        topMarginPercent: 0.08,
        description: '35x45mm. Standard ID size.'
    }
]

export const PAPER_SIZES = [
    { id: '4x6', label: '4x6 inch (10x15cm)', wMm: 101.6, hMm: 152.4 },
    { id: 'a4', label: 'A4 (21x29.7cm)', wMm: 210, hMm: 297 },
]

export function mmToPx(mm: number, dpi: number) {
    return (mm / 25.4) * dpi
}

export function drawPassport(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    image: HTMLImageElement | null,
    standard: PassportStandard,
    zoom: number,
    rotation: number,
    offset: { x: number, y: number },
    showGuides: boolean = false
) {
    // Clear
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (image) {
        ctx.save()

        // Center of canvas
        const cx = canvas.width / 2
        const cy = canvas.height / 2

        ctx.translate(cx, cy)
        ctx.rotate(rotation * Math.PI / 180)

        ctx.translate(offset.x, offset.y)

        // Scale
        const scale = zoom / 100
        // Initial fit: cover the canvas
        const imgAspect = image.width / image.height
        const canvasAspect = canvas.width / canvas.height

        let baseScale
        if (imgAspect > canvasAspect) {
            baseScale = canvas.height / image.height
        } else {
            baseScale = canvas.width / image.width
        }

        const finalScale = baseScale * scale

        ctx.drawImage(
            image,
            -image.width * finalScale / 2,
            -image.height * finalScale / 2,
            image.width * finalScale,
            image.height * finalScale
        )

        ctx.restore()
    }

    if (showGuides) {
        // Draw Guides (Overlay)
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)"
        ctx.lineWidth = canvas.width * 0.005 // Scale line width

        // Head Top Line
        const headTopY = canvas.height * standard.topMarginPercent
        ctx.beginPath()
        ctx.moveTo(0, headTopY)
        ctx.lineTo(canvas.width, headTopY)
        ctx.stroke()

        // Oval Guide
        const ovalH = canvas.height * ((standard.headMinPercent + standard.headMaxPercent) / 2)
        const ovalW = ovalH * 0.75
        const ovalY = headTopY + ovalH / 2

        ctx.beginPath()
        ctx.ellipse(canvas.width / 2, ovalY, ovalW / 2, ovalH / 2, 0, 0, Math.PI * 2)
        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)"
        ctx.setLineDash([canvas.width * 0.01, canvas.width * 0.01])
        ctx.stroke()
        ctx.setLineDash([])

        // Center Line
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width / 2, canvas.height)
        ctx.strokeStyle = "rgba(0, 255, 255, 0.3)"
        ctx.stroke()
    }
}
