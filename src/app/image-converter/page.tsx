"use client"

import React, { useState, useRef } from "react"
import { ConverterSidebar } from "@/components/converter/ConverterSidebar"
import { ConverterCanvas } from "@/components/converter/ConverterCanvas"
import { ImageFile, ConversionSettings, convertImage, downloadImage, downloadBatch } from "@/lib/converter-utils"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ImageConverterPage() {
    const [images, setImages] = useState<ImageFile[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Settings
    const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png')
    const [quality, setQuality] = useState(90)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true)
    const [backgroundColor, setBackgroundColor] = useState('#ffffff')

    const settings: ConversionSettings = {
        format,
        quality,
        width,
        height,
        maintainAspectRatio,
        backgroundColor
    }

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

        Promise.all(validFiles.map(f => new Promise<ImageFile>(resolve => {
            const reader = new FileReader()
            reader.onload = (ev) => {
                const img = new Image()
                img.onload = () => resolve({ file: f, img, name: f.name })
                img.src = ev.target?.result as string
            }
            reader.readAsDataURL(f)
        }))).then(newImages => {
            setImages(prev => [...prev, ...newImages])
        })
    }

    const handleExportSingle = async () => {
        if (images.length === 0) return
        const currentImage = images[currentIndex]
        const blob = await convertImage(currentImage, settings)
        downloadImage(blob, currentImage.name, settings.format)
    }

    const handleExportBatch = async () => {
        if (images.length === 0) return
        await downloadBatch(images, settings)
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden relative">
            <div className="order-2 md:order-1 z-20">
                <ConverterSidebar
                    format={format}
                    setFormat={setFormat}
                    quality={quality}
                    setQuality={setQuality}
                    width={width}
                    setWidth={setWidth}
                    height={height}
                    setHeight={setHeight}
                    maintainAspectRatio={maintainAspectRatio}
                    setMaintainAspectRatio={setMaintainAspectRatio}
                    backgroundColor={backgroundColor}
                    setBackgroundColor={setBackgroundColor}
                    onExportSingle={handleExportSingle}
                    onExportBatch={handleExportBatch}
                    hasImages={images.length > 0}
                    currentFileName={images[currentIndex]?.name || ""}
                />
            </div>

            <div className="flex-1 relative flex flex-col min-h-0 order-1 md:order-2">
                <header className="h-16 shrink-0 border-b border-border bg-card flex items-center px-6 justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-primary">Image Converter</h1>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {images.length > 0 ? `${images.length} image${images.length > 1 ? 's' : ''}` : "Ready"}
                    </div>
                </header>

                {images.length > 0 ? (
                    <ConverterCanvas
                        images={images}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        settings={settings}
                    />
                ) : (
                    <div className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                        <div
                            className="border-4 border-dashed border-primary/20 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-primary/5 transition-colors relative z-20 max-w-md"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
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
                                onClick={(e) => {
                                    e.stopPropagation()
                                    fileInputRef.current?.click()
                                }}
                            >
                                Select Files
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
