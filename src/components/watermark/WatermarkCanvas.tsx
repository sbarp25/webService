import React, { useEffect, useRef } from "react"
import { WatermarkSettings, drawWatermark } from "@/lib/watermark-utils"

interface WatermarkCanvasProps {
    image: HTMLImageElement | null
    settings: WatermarkSettings
    setSettings: (s: Partial<WatermarkSettings>) => void
}

export function WatermarkCanvas({
    image, settings, setSettings
}: WatermarkCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !image) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size to match image (for accurate preview)
        // We might want to scale it down for display if image is huge
        // For now, let's keep it simple and rely on CSS to scale the canvas visual
        canvas.width = image.width
        canvas.height = image.height

        drawWatermark(ctx, canvas, image, settings)

    }, [image, settings])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (settings.isTiled) return
        isDragging.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
        setSettings({ position: 'custom' })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || settings.isTiled) return

        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y

        // Scale delta to canvas space
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const scaleX = canvasRef.current.width / rect.width
            const scaleY = canvasRef.current.height / rect.height

            setSettings({
                customX: settings.customX + dx * scaleX,
                customY: settings.customY + dy * scaleY
            })
        }

        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (settings.isTiled) return
        isDragging.current = true
        const touch = e.touches[0]
        lastPos.current = { x: touch.clientX, y: touch.clientY }
        setSettings({ position: 'custom' })
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || settings.isTiled) return
        const touch = e.touches[0]

        // Prevent scrolling while dragging watermark
        if (e.cancelable) e.preventDefault()

        const dx = touch.clientX - lastPos.current.x
        const dy = touch.clientY - lastPos.current.y

        // Scale delta to canvas space
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const scaleX = canvasRef.current.width / rect.width
            const scaleY = canvasRef.current.height / rect.height

            setSettings({
                customX: settings.customX + dx * scaleX,
                customY: settings.customY + dy * scaleY
            })
        }

        lastPos.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleTouchEnd = () => {
        isDragging.current = false
    }

    return (
        <div
            ref={containerRef}
            className="flex items-center justify-center w-full h-full bg-[#222] p-10 overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <canvas
                ref={canvasRef}
                className={`shadow-2xl border-4 border-white/10 max-w-full max-h-full transition-all ${!settings.isTiled ? 'cursor-move' : ''}`}
            />
        </div>
    )
}
