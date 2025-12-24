import React, { useEffect, useRef, useState } from "react"
import { ImageFile, ConversionSettings, convertImage, formatFileSize } from "@/lib/converter-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ConverterCanvasProps {
    images: ImageFile[]
    currentIndex: number
    setCurrentIndex: (index: number) => void
    settings: ConversionSettings
}

export function ConverterCanvas({ images, currentIndex, setCurrentIndex, settings }: ConverterCanvasProps) {
    const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null)
    const [convertedSize, setConvertedSize] = useState<number>(0)
    const [originalSize, setOriginalSize] = useState<number>(0)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const currentImage = images[currentIndex]

    useEffect(() => {
        if (currentImage) {
            setOriginalSize(currentImage.file.size)
            performConversion()
        }
    }, [currentImage, settings])

    const performConversion = async () => {
        if (!currentImage) return

        try {
            const blob = await convertImage(currentImage, settings)
            setConvertedBlob(blob)
            setConvertedSize(blob.size)

            // Draw preview
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d')
                if (ctx) {
                    const img = await createImageBitmap(blob)
                    canvasRef.current.width = img.width
                    canvasRef.current.height = img.height
                    ctx.drawImage(img, 0, 0)
                }
            }
        } catch (error) {
            console.error('Conversion error:', error)
        }
    }

    if (!currentImage) return null

    const savingsPercent = originalSize > 0
        ? Math.round(((originalSize - convertedSize) / originalSize) * 100)
        : 0

    return (
        <div className="flex-1 bg-secondary/30 relative overflow-auto flex flex-col items-center justify-center p-4 md:p-8">
            {/* Navigation */}
            {images.length > 1 && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1.5 border shadow-sm z-10">
                    <button
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </span>
                    <button
                        onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))}
                        disabled={currentIndex === images.length - 1}
                        className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Preview */}
            <div className="max-w-4xl w-full space-y-4">
                <div className="bg-card rounded-xl border shadow-sm p-6">
                    <div className="flex items-center justify-center mb-4">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-[50vh] md:max-h-[60vh] rounded-lg shadow-md border-2 border-border"
                        />
                    </div>

                    {/* File Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-secondary/50 rounded-lg p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Original</p>
                            <p className="text-lg font-bold">{formatFileSize(originalSize)}</p>
                        </div>
                        <div className="bg-secondary/50 rounded-lg p-4 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Converted</p>
                            <p className="text-lg font-bold">{formatFileSize(convertedSize)}</p>
                        </div>
                        <div className={`rounded-lg p-4 text-center ${savingsPercent > 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                            }`}>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Savings</p>
                            <p className={`text-lg font-bold ${savingsPercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                {savingsPercent > 0 ? '-' : '+'}{Math.abs(savingsPercent)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
