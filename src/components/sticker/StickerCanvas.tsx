import React, { useEffect, useRef, useState } from "react"
import { drawSticker, StickerSettings } from "@/lib/sticker-utils"

// --- EDITOR CANVAS ---

interface StickerEditorCanvasProps {
    image: HTMLImageElement | null
    settings: StickerSettings
}

export function StickerEditorCanvas({ image, settings }: StickerEditorCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [view, setView] = useState({ x: 0, y: 0, scale: 1 })
    const isDragging = useRef(false)
    const lastPos = useRef({ x: 0, y: 0 })

    // Initial Center
    useEffect(() => {
        if (image && containerRef.current && canvasRef.current) {
            const container = containerRef.current
            const canvas = canvasRef.current

            // Calculate canvas size based on image + max offset
            // The canvas itself changes size to fit the sticker + border
            const padding = 150 // max offset
            canvas.width = image.width + padding * 2
            canvas.height = image.height + padding * 2

            // Fit to container
            const scale = Math.min(
                (container.offsetWidth - 100) / canvas.width,
                (container.offsetHeight - 100) / canvas.height
            )

            const x = (container.offsetWidth - canvas.width * scale) / 2
            const y = (container.offsetHeight - canvas.height * scale) / 2

            setView({ x, y, scale })
        }
    }, [image]) // Only re-center on new image

    // Draw
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !image) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Update canvas size if needed (dynamic border)
        // Actually, keeping canvas large enough for max border is safer to avoid resizing canvas constantly
        // But we need to clear it
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawSticker(ctx, canvas, image, settings)
    }, [image, settings])

    // Interaction
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        setView(v => ({ ...v, scale: v.scale * factor }))
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true
        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current) return
        const dx = e.clientX - lastPos.current.x
        const dy = e.clientY - lastPos.current.y
        setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }))
        lastPos.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
        isDragging.current = false
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative cursor-grab active:cursor-grabbing bg-[#0a0a0a]"
            style={{
                backgroundImage: `linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)`,
                backgroundSize: '20px 20px'
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                    position: 'absolute',
                    willChange: 'transform'
                }}
            >
                <canvas ref={canvasRef} />
            </div>
        </div>
    )
}

// --- SHEET CANVAS ---

export interface SheetObject {
    img: HTMLImageElement
    x: number
    y: number
    w: number
    h: number
    aspect: number
}

interface StickerSheetCanvasProps {
    objects: SheetObject[]
    setObjects: React.Dispatch<React.SetStateAction<SheetObject[]>>
    sheetSize: { w: number, h: number } // in pixels (DPI adjusted)
    DPI: number
    canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function StickerSheetCanvas({
    objects, setObjects, sheetSize, DPI, canvasRef
}: StickerSheetCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [view, setView] = useState({ x: 0, y: 0, scale: 0.2 }) // Start zoomed out
    const [selectedIdx, setSelectedIdx] = useState(-1)

    const interaction = useRef({
        isDragging: false,
        isResizing: false,
        isPanning: false,
        lastX: 0,
        lastY: 0,
        dragOffX: 0,
        dragOffY: 0
    })

    // Initial Center
    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current
            // Fit sheet in view
            const scale = Math.min(
                (container.offsetWidth - 50) / sheetSize.w,
                (container.offsetHeight - 50) / sheetSize.h
            )
            const x = (container.offsetWidth - sheetSize.w * scale) / 2
            const y = (container.offsetHeight - sheetSize.h * scale) / 2
            setView({ x, y, scale })
        }
    }, [sheetSize.w, sheetSize.h])

    // Draw
    const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = sheetSize.w
        canvas.height = sheetSize.h

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw Sheet Boundary (Transparent with Dotted Border)
        ctx.strokeStyle = "#444" // Dark grey border for visibility on dark bg
        ctx.lineWidth = 2 / view.scale
        ctx.setLineDash([10 / view.scale, 10 / view.scale])
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        ctx.setLineDash([])

        // Draw Objects
        objects.forEach((obj, i) => {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h)

            // Selection Overlay
            if (i === selectedIdx) {
                const lineWidth = 2 / view.scale
                ctx.strokeStyle = "#ff007b"
                ctx.lineWidth = lineWidth
                ctx.strokeRect(obj.x, obj.y, obj.w, obj.h)

                // Resize Handle
                const handleSize = 10 / view.scale
                ctx.fillStyle = "#ff007b"
                ctx.fillRect(obj.x + obj.w - handleSize / 2, obj.y + obj.h - handleSize / 2, handleSize, handleSize)

                // Dimensions Text
                ctx.fillStyle = "#ff007b"
                ctx.font = `${Math.max(12, 14 / view.scale)}px monospace`
                ctx.fillText(
                    `${(obj.w / DPI).toFixed(1)}x${(obj.h / DPI).toFixed(1)} cm`,
                    obj.x,
                    obj.y - (5 / view.scale)
                )
            }
        })
    }

    useEffect(() => {
        draw()
    }, [objects, sheetSize, selectedIdx, view.scale]) // Redraw on changes

    // Interaction Handlers
    const getMousePos = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        // The canvas is transformed by CSS, so getBoundingClientRect gives the screen coords of the transformed element
        // But we want coords relative to the canvas content (0..width)
        // Since we use a wrapper div for transform, the canvas itself is full resolution but scaled via CSS transform on wrapper?
        // Wait, in EditorCanvas I used a wrapper div for transform.
        // Here I should probably do the same for consistency and performance.
        // Let's check the render: I am drawing to a canvas of size `sheetSize`.
        // The user sees this canvas scaled and translated.

        // If I use the same structure as EditorCanvas:
        // Wrapper (overflow hidden) -> Inner Div (transform) -> Canvas

        // Then e.clientX relative to Inner Div top-left, divided by scale?
        // No, Inner Div is transformed.

        // Let's calculate manually from View state
        if (!containerRef.current) return { x: 0, y: 0 }
        const containerRect = containerRef.current.getBoundingClientRect()
        const mx = e.clientX - containerRect.left
        const my = e.clientY - containerRect.top

        // Apply inverse view transform
        const x = (mx - view.x) / view.scale
        const y = (my - view.y) / view.scale
        return { x, y }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e)
        const state = interaction.current

        // Check handles first
        if (selectedIdx !== -1) {
            const s = objects[selectedIdx]
            const hs = 20 / view.scale // Hit size for handle
            if (x > s.x + s.w - hs && x < s.x + s.w + hs && y > s.y + s.h - hs && y < s.y + s.h + hs) {
                state.isResizing = true
                return
            }
        }

        // Check objects (top to bottom)
        let hit = false
        for (let i = objects.length - 1; i >= 0; i--) {
            const s = objects[i]
            if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) {
                setSelectedIdx(i)
                state.isDragging = true
                state.dragOffX = x - s.x
                state.dragOffY = y - s.y

                // Move to top
                const newObjs = [...objects]
                const [moved] = newObjs.splice(i, 1)
                newObjs.push(moved)
                setObjects(newObjs)
                setSelectedIdx(newObjs.length - 1)

                hit = true
                break
            }
        }

        if (!hit) {
            setSelectedIdx(-1)
            state.isPanning = true
            state.lastX = e.clientX
            state.lastY = e.clientY
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e)
        const state = interaction.current

        if (state.isResizing && selectedIdx !== -1) {
            const newObjs = [...objects]
            const s = { ...newObjs[selectedIdx] }
            s.w = Math.max(10, x - s.x)
            s.h = s.w / s.aspect
            newObjs[selectedIdx] = s
            setObjects(newObjs)
        } else if (state.isDragging && selectedIdx !== -1) {
            const newObjs = [...objects]
            const s = { ...newObjs[selectedIdx] }
            s.x = x - state.dragOffX
            s.y = y - state.dragOffY
            newObjs[selectedIdx] = s
            setObjects(newObjs)
        } else if (state.isPanning) {
            const dx = e.clientX - state.lastX
            const dy = e.clientY - state.lastY
            setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }))
            state.lastX = e.clientX
            state.lastY = e.clientY
        }
    }

    const handleMouseUp = () => {
        interaction.current = {
            isDragging: false,
            isResizing: false,
            isPanning: false,
            lastX: 0, lastY: 0, dragOffX: 0, dragOffY: 0
        }
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        setView(v => ({ ...v, scale: v.scale * factor }))
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full overflow-hidden relative bg-[#222] z-10"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <div
                style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                    transformOrigin: '0 0',
                    position: 'absolute',
                    willChange: 'transform'
                }}
            >
                <canvas ref={canvasRef} className="shadow-2xl" />
            </div>
        </div>
    )
}
