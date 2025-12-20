import React, { useEffect, useRef, useState } from "react"
import { PassportStandard, mmToPx, drawPassport } from "@/lib/passport-utils"

interface PassportCanvasProps {
    image: HTMLImageElement | null
    standard: PassportStandard
    zoom: number
    rotation: number
    offset: { x: number, y: number }
    setOffset: (x: number, y: number) => void
    setZoom: (z: number) => void
}

export function PassportCanvas({
    image, standard, zoom, rotation, offset, setOffset, setZoom
}: PassportCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    // Draw
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Canvas size matches the standard size at high DPI (e.g., 300 DPI for display quality)
        // Or better, we display it at screen DPI but internal logic handles the crop
        // Let's make the canvas size fixed in CSS pixels (e.g. 400px wide) and scale the content
        // Actually, let's use a fixed internal resolution for the crop box
        const DPI = 300 // Internal working DPI
        const widthPx = mmToPx(standard.widthMm, DPI)
        const heightPx = mmToPx(standard.heightMm, DPI)

        canvas.width = widthPx
        canvas.height = heightPx

        drawPassport(ctx, canvas, image, standard, zoom, rotation, offset, true)
    }, [image, standard, zoom, rotation, offset])

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return
        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y

        // We need to scale the drag delta to canvas pixels
        // The canvas is displayed with CSS width/height.
        // Let's get the ratio
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const scaleX = canvasRef.current.width / rect.width
            const scaleY = canvasRef.current.height / rect.height

            setOffset(offset.x + dx * scaleX, offset.y + dy * scaleY)
        }

        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? -5 : 5
        setZoom(Math.min(300, Math.max(50, zoom + factor)))
    }

    return (
        <div
            ref={containerRef}
            className="flex items-center justify-center w-full h-full bg-[#222] p-10 overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <canvas
                ref={canvasRef}
                className="shadow-2xl border-4 border-white/10"
                style={{
                    maxHeight: '80%',
                    maxWidth: '80%',
                    aspectRatio: `${standard.widthMm}/${standard.heightMm}`
                }}
            />
        </div>
    )
}
