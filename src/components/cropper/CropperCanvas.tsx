import React, { useEffect, useRef } from "react"

interface CropperCanvasProps {
    image: HTMLImageElement | null
    zoom: number
    rotation: number
    borderWidth: number
    borderColor: string
    isBgTransparent: boolean
    bgColor: string
    offsetX: number
    offsetY: number
    setOffset: (x: number, y: number) => void
    setZoom: (z: number) => void
}

export function CropperCanvas({
    image,
    zoom,
    rotation,
    borderWidth,
    borderColor,
    isBgTransparent,
    bgColor,
    offsetX,
    offsetY,
    setOffset,
    setZoom
}: CropperCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    // Draw function
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 500
        canvas.width = size
        canvas.height = size

        ctx.clearRect(0, 0, size, size)

        if (!image) return

        ctx.save()

        // Clip circle
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, (size / 2) - (borderWidth / 2), 0, Math.PI * 2)
        ctx.clip()

        // Background
        if (!isBgTransparent) {
            ctx.fillStyle = bgColor
            ctx.fill()
        }

        // Transformations
        ctx.translate(size / 2, size / 2)
        ctx.rotate(rotation * Math.PI / 180)

        const scaleBase = size / Math.min(image.width, image.height)
        const currentScale = scaleBase * (zoom / 100)

        ctx.translate(offsetX, offsetY)

        ctx.drawImage(
            image,
            -image.width * currentScale / 2,
            -image.height * currentScale / 2,
            image.width * currentScale,
            image.height * currentScale
        )

        ctx.restore()

        // Border
        if (borderWidth > 0) {
            ctx.beginPath()
            ctx.arc(size / 2, size / 2, (size / 2) - (borderWidth / 2), 0, Math.PI * 2)
            ctx.strokeStyle = borderColor
            ctx.lineWidth = borderWidth
            ctx.stroke()
        }

    }, [image, zoom, rotation, borderWidth, borderColor, isBgTransparent, bgColor, offsetX, offsetY])

    // Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return
        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y

        // Adjust for rotation if needed, but simple translation is usually what user expects relative to screen
        // However, since we rotate the context, we might need to counter-rotate the delta if we want screen-relative drag
        // But in the draw function, translate happens AFTER rotate. 
        // Wait, in draw(): translate(size/2, size/2) -> rotate -> translate(offsetX, offsetY)
        // So offsetX/Y are in the ROTATED coordinate system.
        // If I rotate 90deg, moving mouse right (positive x) should move image down (positive y in rotated frame)?
        // Let's fix the math.

        const rad = -rotation * Math.PI / 180
        const rotDx = dx * Math.cos(rad) - dy * Math.sin(rad)
        const rotDy = dx * Math.sin(rad) + dy * Math.cos(rad)

        setOffset(offsetX + rotDx, offsetY + rotDy)
        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const direction = e.deltaY > 0 ? -1 : 1
        const step = 5
        const newZoom = Math.max(10, Math.min(400, zoom + (direction * step)))
        setZoom(newZoom)
    }

    return (
        <div
            ref={containerRef}
            className="relative rounded-full shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-transparent"
            style={{ width: 500, height: 500 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full pointer-events-none"
            />
        </div>
    )
}
