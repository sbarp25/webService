"use client"

import React, { useState, useRef } from "react"
import { PassportSidebar } from "@/components/passport/PassportSidebar"
import { PassportCanvas } from "@/components/passport/PassportCanvas"
import { PASSPORT_STANDARDS, PAPER_SIZES, mmToPx, drawPassport } from "@/lib/passport-utils"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PassportPage() {
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Editor State
    const [standard, setStandard] = useState(PASSPORT_STANDARDS[0])
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [paperSizeId, setPaperSizeId] = useState('4x6')

    const handleFile = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        let file: File | undefined
        if ('dataTransfer' in e) {
            file = e.dataTransfer.files[0]
        } else if (e.target instanceof HTMLInputElement && e.target.files) {
            file = e.target.files[0]
        }

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const img = new Image()
                img.onload = () => {
                    setImage(img)
                    // Reset state
                    setZoom(100)
                    setRotation(0)
                    setOffset({ x: 0, y: 0 })
                }
                img.src = ev.target?.result as string
            }
            reader.readAsDataURL(file)
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleExportSingle = () => {
        if (!image) return

        const DPI = 300
        const widthPx = mmToPx(standard.widthMm, DPI)
        const heightPx = mmToPx(standard.heightMm, DPI)

        const canvas = document.createElement('canvas')
        canvas.width = widthPx
        canvas.height = heightPx
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        drawPassport(ctx, canvas, image, standard, zoom, rotation, offset, false)

        const link = document.createElement('a')
        link.download = `passport_${standard.id}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    const handleExportSheet = () => {
        if (!image) return

        const DPI = 300
        const paper = PAPER_SIZES.find(p => p.id === paperSizeId) || PAPER_SIZES[0]

        const sheetW = mmToPx(paper.wMm, DPI)
        const sheetH = mmToPx(paper.hMm, DPI)

        const photoW = mmToPx(standard.widthMm, DPI)
        const photoH = mmToPx(standard.heightMm, DPI)

        const canvas = document.createElement('canvas')
        canvas.width = sheetW
        canvas.height = sheetH
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // White background
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, sheetW, sheetH)

        // Create single photo canvas
        const photoCanvas = document.createElement('canvas')
        photoCanvas.width = photoW
        photoCanvas.height = photoH
        const photoCtx = photoCanvas.getContext('2d')
        if (!photoCtx) return

        drawPassport(photoCtx, photoCanvas, image, standard, zoom, rotation, offset, false)

        // Tile logic
        const margin = mmToPx(5, DPI) // 5mm margin
        const gap = mmToPx(2, DPI) // 2mm gap

        const cols = Math.floor((sheetW - margin * 2 + gap) / (photoW + gap))
        const rows = Math.floor((sheetH - margin * 2 + gap) / (photoH + gap))

        // Center the grid
        const gridW = cols * photoW + (cols - 1) * gap
        const gridH = rows * photoH + (rows - 1) * gap

        const startX = (sheetW - gridW) / 2
        const startY = (sheetH - gridH) / 2

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * (photoW + gap)
                const y = startY + r * (photoH + gap)

                ctx.drawImage(photoCanvas, x, y)

                // Cut marks (optional)
                ctx.strokeStyle = "#ddd"
                ctx.lineWidth = 1
                ctx.strokeRect(x, y, photoW, photoH)
            }
        }

        const link = document.createElement('a')
        link.download = `passport_sheet_${paper.id}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <PassportSidebar
                standard={standard} setStandard={setStandard}
                zoom={zoom} setZoom={setZoom}
                rotation={rotation} setRotation={setRotation}
                paperSizeId={paperSizeId} setPaperSizeId={setPaperSizeId}
                onExportSingle={handleExportSingle}
                onExportSheet={handleExportSheet}
                hasImage={!!image}
            />

            <div className="flex-1 relative flex flex-col">
                <header className="h-16 border-b border-border bg-card flex items-center px-6 justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-primary">Passport Photo Maker</h1>
                    </div>
                </header>

                <div className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                    {image ? (
                        <PassportCanvas
                            image={image}
                            standard={standard}
                            zoom={zoom}
                            rotation={rotation}
                            offset={offset}
                            setOffset={(x, y) => setOffset({ x, y })}
                            setZoom={setZoom}
                        />
                    ) : (
                        <div
                            className="border-4 border-dashed border-primary/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors relative z-10"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDrop={handleFile}
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                <Upload size={40} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Upload Photo</h3>
                            <p className="text-muted-foreground mb-6">Drag & drop or click to browse</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFile}
                            />
                            <button
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                            >
                                Select Photo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
