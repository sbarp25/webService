
import React, { useRef, useEffect, useState } from "react"
import { LaserSettings, processForLaser, DEFAULT_LASER_SETTINGS } from "@/lib/laser-utils"
import { Upload, ZoomIn, ZoomOut } from "lucide-react"

interface LaserEditorProps {
    file: File | null
    settings: LaserSettings
    onProcessStart: () => void
    onProcessEnd: () => void
    onUpload: (file: File) => void
    canvasRef: React.RefObject<HTMLCanvasElement>
}

export function LaserEditor({
    file,
    settings,
    onProcessStart,
    onProcessEnd,
    onUpload,
    canvasRef
}: LaserEditorProps) {
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null)
    const [zoom, setZoom] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)

    // Load image when file changes
    useEffect(() => {
        if (!file) return

        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
            setOriginalImage(img)
            URL.revokeObjectURL(url)
            setZoom(1)
        }
        img.src = url
    }, [file])

    // Process image when settings or original image changes
    useEffect(() => {
        if (!originalImage || !canvasRef.current) return

        const process = async () => {
            onProcessStart()

            // Give UI a moment to update
            await new Promise(resolve => setTimeout(resolve, 10))

            try {
                // Resize based on scale setting
                const targetWidth = Math.floor(originalImage.width * settings.scale)
                const targetHeight = Math.floor(originalImage.height * settings.scale)

                const canvas = canvasRef.current!
                canvas.width = targetWidth
                canvas.height = targetHeight
                const ctx = canvas.getContext('2d')

                if (!ctx) return

                // Draw original first to get data
                ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight)
                const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)

                // Process
                const processedData = await processForLaser(imageData, settings)

                // Put back
                ctx.putImageData(processedData, 0, 0)
            } catch (error) {
                console.error("Processing failed", error)
            } finally {
                onProcessEnd()
            }
        }

        process()
    }, [originalImage, settings, settings.scale, settings.algorithm, settings.brightness, settings.contrast, settings.threshold, settings.inverted])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0])
        }
    }

    if (!file || !originalImage) {
        return (
            <div
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-secondary/20 m-4 md:m-8 transition-colors hover:bg-secondary/40"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className="text-center p-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                        <Upload size={40} />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Drop your image here</h3>
                    <p className="text-muted-foreground mb-6">Supports PNG, JPG, WebP</p>
                    <label className="px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 cursor-pointer font-medium transition-transform active:scale-95 shadow-lg shadow-primary/20">
                        Choose Image
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                        />
                    </label>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 relative overflow-hidden bg-secondary/10 flex flex-col">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-4 shadow-lg">
                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:text-primary"><ZoomOut size={20} /></button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1 hover:text-primary"><ZoomIn size={20} /></button>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-auto flex items-center justify-center p-8"
            >
                <div
                    className="relative shadow-2xl bg-white"
                    style={{
                        width: originalImage.width * settings.scale * zoom,
                        height: originalImage.height * settings.scale * zoom,
                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full rendering-pixelated"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </div>
            </div>
        </div>
    )
}
