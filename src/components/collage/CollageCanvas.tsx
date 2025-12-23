import React, { useRef, useState, useEffect } from "react"
import { CollageLayout, CollageSlot } from "./CollageLayouts"
import { Upload, X, Move } from "lucide-react"

interface CollageCanvasProps {
    layout: CollageLayout
    width: number
    height: number
    spacing: number
    borderRadius: number
    background: string
    images: Record<string, HTMLImageElement | null>
    setImages: React.Dispatch<React.SetStateAction<Record<string, HTMLImageElement | null>>>
    canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function CollageCanvas({
    layout, width, height, spacing, borderRadius, background,
    images, setImages, canvasRef
}: CollageCanvasProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [activeSlot, setActiveSlot] = useState<string | null>(null)
    const [draggedImage, setDraggedImage] = useState<string | null>(null)
    const [transforms, setTransforms] = useState<Record<string, { x: number, y: number, scale: number }>>({})
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const interactionRef = useRef<{ isPanning: boolean, startX: number, startY: number, slotId: string | null }>({
        isPanning: false, startX: 0, startY: 0, slotId: null
    })

    // Handle clicking outside to deselect
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
            if (!(e.target as HTMLElement).closest('.collage-slot')) {
                setSelectedSlot(null)
            }
        }
        window.addEventListener('mousedown', handleGlobalClick)
        window.addEventListener('touchstart', handleGlobalClick)
        return () => {
            window.removeEventListener('mousedown', handleGlobalClick)
            window.removeEventListener('touchstart', handleGlobalClick)
        }
    }, [])

    // Helper to draw the collage to the canvas (hidden or visible)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = width
        canvas.height = height

        // Background
        ctx.fillStyle = background
        ctx.fillRect(0, 0, width, height)

        // Draw slots
        layout.slots.forEach(slot => {
            const slotW = (width * slot.w) / 100
            const slotH = (height * slot.h) / 100
            const slotX = (width * slot.x) / 100
            const slotY = (height * slot.y) / 100

            // Apply spacing
            const gap = spacing
            const drawX = slotX + gap / 2
            const drawY = slotY + gap / 2
            const drawW = Math.max(0, slotW - gap)
            const drawH = Math.max(0, slotH - gap)

            ctx.save()

            // Rounded corners clipping
            ctx.beginPath()
            // Manual rounded rect for better compatibility
            const r = borderRadius
            ctx.moveTo(drawX + r, drawY)
            ctx.lineTo(drawX + drawW - r, drawY)
            ctx.quadraticCurveTo(drawX + drawW, drawY, drawX + drawW, drawY + r)
            ctx.lineTo(drawX + drawW, drawY + drawH - r)
            ctx.quadraticCurveTo(drawX + drawW, drawY + drawH, drawX + drawW - r, drawY + drawH)
            ctx.lineTo(drawX + r, drawY + drawH)
            ctx.quadraticCurveTo(drawX, drawY + drawH, drawX, drawY + drawH - r)
            ctx.lineTo(drawX, drawY + r)
            ctx.quadraticCurveTo(drawX, drawY, drawX + r, drawY)
            ctx.closePath()
            ctx.clip()

            const img = images[slot.id]
            if (img) {
                // Cover fit
                const imgRatio = img.width / img.height
                const slotRatio = drawW / drawH
                let renderW, renderH, renderX, renderY

                if (imgRatio > slotRatio) {
                    renderH = drawH
                    renderW = drawH * imgRatio
                    renderX = drawX - (renderW - drawW) / 2
                    renderY = drawY
                } else {
                    renderW = drawW
                    renderH = drawW / imgRatio
                    renderX = drawX
                    renderY = drawY - (renderH - drawH) / 2
                }

                // Apply Transforms
                const t = transforms[slot.id] || { x: 0, y: 0, scale: 1 }

                // Scale around center
                const cx = renderX + renderW / 2
                const cy = renderY + renderH / 2

                renderW *= t.scale
                renderH *= t.scale
                renderX = cx - renderW / 2 + t.x
                renderY = cy - renderH / 2 + t.y

                ctx.drawImage(img, renderX, renderY, renderW, renderH)
            } else {
                ctx.fillStyle = "#e5e7eb" // placeholder gray
                ctx.fillRect(drawX, drawY, drawW, drawH)
            }

            ctx.restore()
        })

    }, [layout, width, height, spacing, borderRadius, background, images, transforms])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && activeSlot) {
            const file = e.target.files[0]
            const reader = new FileReader()
            reader.onload = (ev) => {
                const img = new Image()
                img.onload = () => {
                    setImages(prev => ({ ...prev, [activeSlot]: img }))
                }
                img.src = ev.target?.result as string
            }
            reader.readAsDataURL(file)
        }
        setActiveSlot(null)
    }

    const handleDrop = (e: React.DragEvent, slotId: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (draggedImage && draggedImage !== slotId) {
            // Swap logic
            const sourceImg = images[draggedImage]
            const targetImg = images[slotId]
            setImages(prev => ({
                ...prev,
                [draggedImage]: targetImg,
                [slotId]: sourceImg
            }))
            // Reset transform for swapped images? Or keep? 
            // Usually better to reset as the image might have different aspect ratio
            setTransforms(prev => {
                const next = { ...prev }
                delete next[draggedImage]
                delete next[slotId]
                return next
            })
            setDraggedImage(null)
            return
        }

        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const img = new Image()
                img.onload = () => {
                    setImages(prev => ({ ...prev, [slotId]: img }))
                }
                img.src = ev.target?.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    const handleWheel = (e: React.WheelEvent, slotId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        setTransforms(prev => {
            const t = prev[slotId] || { x: 0, y: 0, scale: 1 }
            return { ...prev, [slotId]: { ...t, scale: Math.max(0.1, t.scale * factor) } }
        })
    }

    const handleMouseDown = (e: React.MouseEvent, slotId: string) => {
        if (!images[slotId]) return
        e.stopPropagation()
        interactionRef.current = {
            isPanning: true,
            startX: e.clientX,
            startY: e.clientY,
            slotId
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interactionRef.current.isPanning || !interactionRef.current.slotId) return
        e.preventDefault()

        const dx = e.clientX - interactionRef.current.startX
        const dy = e.clientY - interactionRef.current.startY

        const slotId = interactionRef.current.slotId

        setTransforms(prev => {
            const t = prev[slotId] || { x: 0, y: 0, scale: 1 }
            return { ...prev, [slotId]: { ...t, x: t.x + dx, y: t.y + dy } }
        })

        interactionRef.current.startX = e.clientX
        interactionRef.current.startY = e.clientY
    }

    const handleTouchStart = (e: React.TouchEvent, slotId: string) => {
        if (!images[slotId]) return
        e.stopPropagation()
        const touch = e.touches[0]
        interactionRef.current = {
            isPanning: true,
            startX: touch.clientX,
            startY: touch.clientY,
            slotId
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!interactionRef.current.isPanning || !interactionRef.current.slotId) return

        // Prevent scrolling while panning
        if (e.cancelable) e.preventDefault()

        const touch = e.touches[0]
        const dx = touch.clientX - interactionRef.current.startX
        const dy = touch.clientY - interactionRef.current.startY

        const slotId = interactionRef.current.slotId

        setTransforms(prev => {
            const t = prev[slotId] || { x: 0, y: 0, scale: 1 }
            return { ...prev, [slotId]: { ...t, x: t.x + dx, y: t.y + dy } }
        })

        interactionRef.current.startX = touch.clientX
        interactionRef.current.startY = touch.clientY
    }

    const handleTouchEnd = () => {
        interactionRef.current.isPanning = false
        interactionRef.current.slotId = null
    }

    const handleMouseUp = () => {
        interactionRef.current.isPanning = false
        interactionRef.current.slotId = null
    }

    return (
        <div
            className="relative w-full h-full flex items-center justify-center p-8 bg-secondary/30 overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            {/* Hidden canvas for export */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Interactive DOM overlay */}
            <div
                className="relative shadow-2xl transition-all duration-300 z-10 flex items-center justify-center"
                style={{
                    backgroundColor: background
                }}
            >
                {/* Spacer to force aspect ratio while fitting in parent */}
                <img
                    src={`data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`)}`}
                    className="block max-w-[calc(100vw-32px)] md:max-w-[calc(100vw-400px)] max-h-[50vh] md:max-h-[calc(100vh-150px)] w-auto h-auto opacity-0 pointer-events-none transition-all duration-300"
                    alt=""
                />

                {/* Slots Layer */}
                <div className="absolute inset-0 w-full h-full">
                    {layout.slots.map(slot => {
                        const img = images[slot.id]
                        return (
                            <div
                                key={slot.id}
                                className="absolute overflow-hidden group transition-all"
                                style={{
                                    left: `${slot.x}%`,
                                    top: `${slot.y}%`,
                                    width: `${slot.w}%`,
                                    height: `${slot.h}%`,
                                    padding: `${spacing / 2}px` // Visual spacing approximation
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, slot.id)}
                            >
                                <div
                                    className={`collage-slot w-full h-full relative bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-transparent hover:border-primary/50 transition-colors ${!img ? 'border-dashed border-muted-foreground/30' : ''} ${selectedSlot === slot.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                    style={{ borderRadius: `${borderRadius}px` }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!img) {
                                            setActiveSlot(slot.id)
                                            fileInputRef.current?.click()
                                        } else {
                                            setSelectedSlot(selectedSlot === slot.id ? null : slot.id)
                                        }
                                    }}
                                    onWheel={(e) => handleWheel(e, slot.id)}
                                    onMouseDown={(e) => handleMouseDown(e, slot.id)}
                                    onTouchStart={(e) => handleTouchStart(e, slot.id)}
                                >
                                    {img ? (
                                        <>
                                            <div
                                                className="w-full h-full pointer-events-none"
                                                style={{
                                                    backgroundImage: `url(${img.src})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    transform: (() => {
                                                        const t = transforms[slot.id] || { x: 0, y: 0, scale: 1 }
                                                        return `translate(${t.x}px, ${t.y}px) scale(${t.scale})`
                                                    })()
                                                }}
                                            />

                                            {/* Controls */}
                                            <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${selectedSlot === slot.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <div
                                                    className="p-1 bg-black/50 text-white rounded-full cursor-grab active:cursor-grabbing hover:bg-primary/80"
                                                    draggable
                                                    onDragStart={(e) => {
                                                        e.stopPropagation()
                                                        setDraggedImage(slot.id)
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()} // Prevent pan start
                                                >
                                                    <Move size={12} />
                                                </div>
                                                <button
                                                    className="p-1 bg-black/50 text-white rounded-full hover:bg-red-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setImages(prev => ({ ...prev, [slot.id]: null }))
                                                        setTransforms(prev => {
                                                            const next = { ...prev }
                                                            delete next[slot.id]
                                                            return next
                                                        })
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-muted-foreground flex flex-col items-center gap-2 pointer-events-none">
                                            <Upload size={24} />
                                            <span className="text-xs font-medium">Add Photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
    )
}
