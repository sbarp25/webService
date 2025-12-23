"use client"

import React, { useState, useEffect, useRef } from "react"
import { CropperSidebar } from "@/components/cropper/CropperSidebar"
import { CropperCanvas } from "@/components/cropper/CropperCanvas"
import { Upload, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CircleCropperPage() {
    const [images, setImages] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [currentImgObj, setCurrentImgObj] = useState<HTMLImageElement | null>(null)

    // Editor State
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)
    const [borderWidth, setBorderWidth] = useState(0)
    const [borderColor, setBorderColor] = useState("#ffffff")
    const [isBgTransparent, setIsBgTransparent] = useState(true)
    const [bgColor, setBgColor] = useState("#ffffff")
    const [outputSize, setOutputSize] = useState(0)
    const [outputFormat, setOutputFormat] = useState<"image/png" | "image/webp">("image/png")
    const [offset, setOffset] = useState({ x: 0, y: 0 })

    // Load image when index changes
    useEffect(() => {
        if (images.length > 0 && currentIndex < images.length) {
            const file = images[currentIndex]
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    setCurrentImgObj(img)
                    resetEditor()
                }
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        } else {
            setCurrentImgObj(null)
        }
    }, [images, currentIndex])

    const resetEditor = () => {
        setZoom(100)
        setRotation(0)
        setBorderWidth(0)
        setIsBgTransparent(true)
        setOffset({ x: 0, y: 0 })
    }

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

    const handleSave = () => {
        if (!currentImgObj) return

        const size = outputSize || Math.min(currentImgObj.width, currentImgObj.height)
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Draw logic (duplicated from Canvas component but for export)
        // We need to replicate the exact transform logic

        ctx.save()
        ctx.beginPath()
        const scaledBorderW = borderWidth * (size / 500) // Scale border relative to 500px canvas
        ctx.arc(size / 2, size / 2, (size / 2) - (scaledBorderW / 2), 0, Math.PI * 2)
        ctx.clip()

        if (!isBgTransparent) {
            ctx.fillStyle = bgColor
            ctx.fill()
        }

        ctx.translate(size / 2, size / 2)
        ctx.rotate(rotation * Math.PI / 180)

        // Scale offset
        const scaleFactor = size / 500
        ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor)

        const scaleBase = size / Math.min(currentImgObj.width, currentImgObj.height)
        const currentScale = scaleBase * (zoom / 100)

        ctx.drawImage(
            currentImgObj,
            -currentImgObj.width * currentScale / 2,
            -currentImgObj.height * currentScale / 2,
            currentImgObj.width * currentScale,
            currentImgObj.height * currentScale
        )
        ctx.restore()

        if (borderWidth > 0) {
            ctx.beginPath()
            ctx.arc(size / 2, size / 2, (size / 2) - (scaledBorderW / 2), 0, Math.PI * 2)
            ctx.strokeStyle = borderColor
            ctx.lineWidth = scaledBorderW
            ctx.stroke()
        }

        const link = document.createElement('a')
        const originalName = images[currentIndex].name
        const ext = outputFormat === 'image/webp' ? 'webp' : 'png'
        link.download = `cropped_${originalName.split('.')[0]}.${ext}`
        link.href = canvas.toDataURL(outputFormat, 0.9)
        link.click()

        if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1)
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden relative">
            <div className="order-2 md:order-1 z-10">
                <CropperSidebar
                    zoom={zoom} setZoom={setZoom}
                    rotation={rotation} setRotation={setRotation}
                    borderWidth={borderWidth} setBorderWidth={setBorderWidth}
                    borderColor={borderColor} setBorderColor={setBorderColor}
                    isBgTransparent={isBgTransparent} setIsBgTransparent={setIsBgTransparent}
                    bgColor={bgColor} setBgColor={setBgColor}
                    outputSize={outputSize} setOutputSize={setOutputSize}
                    outputFormat={outputFormat} setOutputFormat={(v) => setOutputFormat(v)}
                    onSave={handleSave}
                    onSkip={() => setCurrentIndex(prev => Math.min(prev + 1, images.length - 1))}
                    onReset={resetEditor}
                    hasImage={!!currentImgObj}
                    fileName={images[currentIndex]?.name || ""}
                />
            </div>

            <div className="flex-1 relative flex flex-col min-h-0 order-1 md:order-2">
                <header className="h-16 shrink-0 border-b border-border bg-card flex items-center px-6 justify-between z-10">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-primary">Pro Circle Cropper</h1>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {images.length > 0 ? `${currentIndex + 1} / ${images.length}` : "Ready"}
                    </div>
                </header>

                <div className="flex-1 bg-secondary/30 relative overflow-hidden flex items-center justify-center p-8">
                    {/* Checkerboard background */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)`,
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    />

                    {currentImgObj ? (
                        <CropperCanvas
                            image={currentImgObj}
                            zoom={zoom}
                            rotation={rotation}
                            borderWidth={borderWidth}
                            borderColor={borderColor}
                            isBgTransparent={isBgTransparent}
                            bgColor={bgColor}
                            offsetX={offset.x}
                            offsetY={offset.y}
                            setOffset={(x, y) => setOffset({ x, y })}
                            setZoom={setZoom}
                        />
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
