"use client"

import React, { useState, useRef } from "react"
import { StickerSidebar } from "@/components/sticker/StickerSidebar"
import { StickerEditorCanvas, StickerSheetCanvas, SheetObject } from "@/components/sticker/StickerCanvas"
import { drawSticker } from "@/lib/sticker-utils"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"
import JSZip from "jszip"

const DPI = 118.11 // pixels per cm

export default function StickerStudioPage() {
    // Data
    const [queue, setQueue] = useState<{ img: HTMLImageElement, name: string }[]>([])
    const [idx, setIdx] = useState(0)

    // Editor State
    const [borderSize, setBorderSize] = useState(30)
    const [borderColor, setBorderColor] = useState("#ffffff")

    // Sheet State
    const [isSheetMode, setIsSheetMode] = useState(false)
    const [sheetObjects, setSheetObjects] = useState<SheetObject[]>([])
    const [sheetType, setSheetType] = useState<"a4" | "custom">("a4")
    const [customW, setCustomW] = useState(20)
    const [customH, setCustomH] = useState(20)
    const [globalWidth, setGlobalWidth] = useState<number>(0)

    const sheetCanvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Computed Sheet Size
    const sheetSize = sheetType === 'a4'
        ? { w: 21 * DPI, h: 29.7 * DPI }
        : { w: customW * DPI, h: customH * DPI }

    // Handlers
    const handleFiles = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        let files: File[] = []
        if ('dataTransfer' in e) {
            e.preventDefault()
            files = Array.from(e.dataTransfer.files)
        } else if (e.target.files) {
            files = Array.from(e.target.files)
        }

        const validFiles = files.filter(f => f.type.startsWith('image/'))
        if (validFiles.length === 0) return

        Promise.all(validFiles.map(f => new Promise<{ img: HTMLImageElement, name: string }>(resolve => {
            const r = new FileReader()
            r.onload = (ev) => {
                const img = new Image()
                img.onload = () => resolve({ img, name: f.name })
                img.src = ev.target?.result as string
            }
            r.readAsDataURL(f)
        }))).then(newItems => {
            setQueue(prev => [...prev, ...newItems])
        })
    }

    const handleExportPng = () => {
        if (!queue[idx]) return
        const item = queue[idx]
        const canvas = document.createElement('canvas')
        // Size needs to account for border
        const padding = 150
        canvas.width = item.img.width + padding * 2
        canvas.height = item.img.height + padding * 2

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        drawSticker(ctx, canvas, item.img, { offset: borderSize, color: borderColor })

        // Trim empty space? The original code didn't trim explicitly but set canvas size based on offset.
        // My drawSticker centers the image.
        // Let's use a tighter canvas if possible, or just export as is.
        // The original code: mainCanvas.width = queue[idx].img.width + (sets.offset * 2.5);
        // I'll stick to that logic for consistency.

        const tightCanvas = document.createElement('canvas')
        tightCanvas.width = item.img.width + (borderSize * 2.5)
        tightCanvas.height = item.img.height + (borderSize * 2.5)
        const tCtx = tightCanvas.getContext('2d')
        if (tCtx) drawSticker(tCtx, tightCanvas, item.img, { offset: borderSize, color: borderColor })

        const link = document.createElement('a')
        link.download = `sticker_${item.name.split('.')[0]}.png`
        link.href = tightCanvas.toDataURL("image/png")
        link.click()
    }

    const handleExportZip = async () => {
        const zip = new JSZip()

        for (const item of queue) {
            const canvas = document.createElement('canvas')
            canvas.width = item.img.width + (borderSize * 2.5)
            canvas.height = item.img.height + (borderSize * 2.5)
            const ctx = canvas.getContext('2d')
            if (ctx) {
                drawSticker(ctx, canvas, item.img, { offset: borderSize, color: borderColor })
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'))
                if (blob) zip.file(`sticker_${item.name.split('.')[0]}.png`, blob)
            }
        }

        const content = await zip.generateAsync({ type: "blob" })
        const link = document.createElement('a')
        link.download = "stickers.zip"
        link.href = URL.createObjectURL(content)
        link.click()
    }

    const handleEnterSheetMode = () => {
        // Generate sheet objects
        const newObjects: SheetObject[] = []
        let cx = 100
        let cy = 150

        queue.forEach(item => {
            // Create sticker image
            const canvas = document.createElement('canvas')
            canvas.width = item.img.width + (borderSize * 2.5)
            canvas.height = item.img.height + (borderSize * 2.5)
            const ctx = canvas.getContext('2d')
            if (ctx) drawSticker(ctx, canvas, item.img, { offset: borderSize, color: borderColor })

            const stickerImg = new Image()
            stickerImg.src = canvas.toDataURL()

            // Default size: 35% of original? Original code: t.width * 0.35
            const w = canvas.width * 0.35
            const h = canvas.height * 0.35

            newObjects.push({
                img: stickerImg,
                x: cx,
                y: cy,
                w,
                h,
                aspect: w / h
            })

            cx += 350
            if (cx > sheetSize.w - 400) {
                cx = 100
                cy += 450
            }
        })

        setSheetObjects(newObjects)
        setIsSheetMode(true)
    }

    const handleExportSheet = () => {
        if (!sheetCanvasRef.current) return
        // We need to redraw without selection indicators
        // The StickerSheetCanvas component handles drawing, but it draws selection if selectedIdx is set.
        // We can force a redraw here on a temp canvas or just use the ref if we clear selection first.
        // But we can't easily clear selection from here without state.
        // Better: Render to a new canvas manually using sheetObjects.

        const canvas = document.createElement('canvas')
        canvas.width = sheetSize.w
        canvas.height = sheetSize.h
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Transparent bg
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        sheetObjects.forEach(obj => {
            ctx.drawImage(obj.img, obj.x, obj.y, obj.w, obj.h)
        })

        const link = document.createElement('a')
        link.download = "Sheet_Print.png"
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    const applyGlobalWidth = () => {
        if (globalWidth > 0) {
            setSheetObjects(prev => prev.map(obj => ({
                ...obj,
                w: globalWidth * DPI,
                h: (globalWidth * DPI) / obj.aspect
            })))
        }
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <StickerSidebar
                borderSize={borderSize} setBorderSize={setBorderSize}
                borderColor={borderColor} setBorderColor={setBorderColor}
                hasImages={queue.length > 0}
                currentFileName={queue[idx]?.name || ""}
                onNext={() => setIdx(i => (i + 1) % queue.length)}
                onPrev={() => setIdx(i => (i - 1 + queue.length) % queue.length)}
                onExportPng={handleExportPng}
                onExportZip={handleExportZip}
                onEnterSheetMode={handleEnterSheetMode}
                onReset={() => { setQueue([]); setIdx(0); setIsSheetMode(false); }}
                isSheetMode={isSheetMode}
                sheetSettings={{
                    globalWidth, setGlobalWidth, applyGlobalWidth,
                    sheetType, setSheetType: (v) => setSheetType(v),
                    customW, setCustomW, customH, setCustomH,
                    onExportSheet: handleExportSheet,
                    onExitSheetMode: () => setIsSheetMode(false)
                }}
            />

            <div className="flex-1 relative flex flex-col">
                <header className="h-16 border-b border-border bg-card flex items-center px-6 justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-primary">Sticker Pro Studio</h1>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {queue.length > 0 ? `${idx + 1} / ${queue.length}` : "Ready"}
                    </div>
                </header>

                <div className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                    {queue.length > 0 ? (
                        isSheetMode ? (
                            <StickerSheetCanvas
                                objects={sheetObjects}
                                setObjects={setSheetObjects}
                                sheetSize={sheetSize}
                                DPI={DPI}
                                canvasRef={sheetCanvasRef}
                            />
                        ) : (
                            <StickerEditorCanvas
                                image={queue[idx].img}
                                settings={{ offset: borderSize, color: borderColor }}
                            />
                        )
                    ) : (
                        <div
                            className="border-4 border-dashed border-primary/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors relative z-20"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFiles}
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                <Upload size={40} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Upload Images</h3>
                            <p className="text-muted-foreground mb-6">Drag & drop PNGs to start</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFiles}
                            />
                            <button
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                            >
                                Select Files
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
