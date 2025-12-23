"use client"

import React, { useState, useRef } from "react"
import { WatermarkSidebar } from "@/components/watermark/WatermarkSidebar"
import { WatermarkCanvas } from "@/components/watermark/WatermarkCanvas"
import { WatermarkSettings, DEFAULT_WATERMARK_SETTINGS, drawWatermark } from "@/lib/watermark-utils"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"
import JSZip from "jszip"

export default function WatermarkPage() {
    const [images, setImages] = useState<File[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentImgObj, setCurrentImgObj] = useState<HTMLImageElement | null>(null)
    const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_WATERMARK_SETTINGS)
    const [isGridView, setIsGridView] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Load current image
    React.useEffect(() => {
        if (images.length > 0 && currentIndex < images.length) {
            const file = images[currentIndex]
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => setCurrentImgObj(img)
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        } else {
            setCurrentImgObj(null)
        }
    }, [images, currentIndex])

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        let files: File[] = []
        if ('dataTransfer' in e) {
            files = Array.from(e.dataTransfer.files)
        } else if (e.target instanceof HTMLInputElement && e.target.files) {
            files = Array.from(e.target.files)
        }

        const validFiles = files.filter(f => f.type.startsWith('image/'))
        if (validFiles.length > 0) {
            setImages(prev => [...prev, ...validFiles])
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleExport = async () => {
        if (images.length === 0) return

        if (images.length === 1) {
            // Single file export
            const file = images[0]
            const img = await new Promise<HTMLImageElement>((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => {
                    const image = new Image()
                    image.onload = () => resolve(image)
                    image.src = e.target?.result as string
                }
                reader.readAsDataURL(file)
            })

            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                drawWatermark(ctx, canvas, img, settings)
                const link = document.createElement('a')
                link.download = `watermarked_${file.name}`
                link.href = canvas.toDataURL("image/png")
                link.click()
            }
        } else {
            // Batch export (ZIP)
            const zip = new JSZip()
            const folder = zip.folder("watermarked_images")

            // Process all images
            for (let i = 0; i < images.length; i++) {
                const file = images[i]
                const img = await new Promise<HTMLImageElement>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        const image = new Image()
                        image.onload = () => resolve(image)
                        image.src = e.target?.result as string
                    }
                    reader.readAsDataURL(file)
                })

                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    drawWatermark(ctx, canvas, img, settings)
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
                    if (blob && folder) {
                        folder.file(`watermarked_${file.name}`, blob)
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(content)
            link.download = "watermarked_images.zip"
            link.click()
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden relative">
            <div className="order-2 md:order-1 z-20">
                <WatermarkSidebar
                    settings={settings}
                    updateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
                    onExport={handleExport}
                    hasImage={images.length > 0}
                />
            </div>

            <div className="flex-1 relative flex flex-col min-h-0 order-1 md:order-2">
                <header className="h-16 shrink-0 border-b border-border bg-card flex items-center px-6 justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-primary">Watermark Tool</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsGridView(!isGridView)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isGridView ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {isGridView ? 'Single View' : 'Grid View'}
                        </button>
                        <div className="text-sm text-muted-foreground">
                            {images.length > 0 ? `${currentIndex + 1} / ${images.length}` : "Ready"}
                        </div>
                    </div>
                </header>

                <div className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                    {images.length > 0 ? (
                        isGridView ? (
                            <div className="w-full h-full overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start">
                                {images.map((file, idx) => (
                                    <div key={idx} className="aspect-square bg-card rounded-xl shadow-sm border border-border overflow-hidden relative">
                                        <WatermarkPreviewItem file={file} settings={settings} />
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                                            {file.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            currentImgObj && (
                                <WatermarkCanvas
                                    image={currentImgObj}
                                    settings={settings}
                                    setSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
                                />
                            )
                        )
                    ) : (
                        <div
                            className="border-4 border-dashed border-primary/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors relative z-10"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDrop={handleFiles}
                        >
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                                <Upload size={40} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Upload Images</h3>
                            <p className="text-muted-foreground mb-6">Drag & drop or click to browse</p>
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

function WatermarkPreviewItem({ file, settings }: { file: File, settings: WatermarkSettings }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const img = new Image()
        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (ctx) {
                drawWatermark(ctx, canvas, img, settings)
            }
        }
        img.src = URL.createObjectURL(file)
    }, [file, settings])

    return <canvas ref={canvasRef} className="w-full h-full object-contain" />
}
