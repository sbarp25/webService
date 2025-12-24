import React from "react"
import { Slider } from "@/components/ui/Slider"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { Download, Archive, Image as ImageIcon, Settings2 } from "lucide-react"

interface ConverterSidebarProps {
    format: 'image/png' | 'image/jpeg' | 'image/webp'
    setFormat: (format: 'image/png' | 'image/jpeg' | 'image/webp') => void
    quality: number
    setQuality: (quality: number) => void
    width: number
    setWidth: (width: number) => void
    height: number
    setHeight: (height: number) => void
    maintainAspectRatio: boolean
    setMaintainAspectRatio: (maintain: boolean) => void
    backgroundColor: string
    setBackgroundColor: (color: string) => void
    onExportSingle: () => void
    onExportBatch: () => void
    hasImages: boolean
    currentFileName: string
}

export function ConverterSidebar({
    format, setFormat,
    quality, setQuality,
    width, setWidth,
    height, setHeight,
    maintainAspectRatio, setMaintainAspectRatio,
    backgroundColor, setBackgroundColor,
    onExportSingle, onExportBatch,
    hasImages, currentFileName
}: ConverterSidebarProps) {
    return (
        <aside className="w-full md:w-80 bg-card border-r border-border flex flex-col h-[40vh] md:h-full z-20 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border hidden md:block">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <ImageIcon size={20} />
                    Image Converter
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Convert image formats</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Current File */}
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current File</h3>
                    <div className={`p-3 rounded-lg bg-secondary/50 border border-border text-sm font-medium text-primary truncate ${hasImages ? 'opacity-100' : 'opacity-50'}`}>
                        {hasImages ? currentFileName : "No file loaded"}
                    </div>
                </div>

                {/* Format Selection */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <Settings2 size={18} />
                        <h3 className="font-semibold">Output Format</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => setFormat('image/png')}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${format === 'image/png'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                        >
                            PNG
                        </button>
                        <button
                            onClick={() => setFormat('image/jpeg')}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${format === 'image/jpeg'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                        >
                            JPEG
                        </button>
                        <button
                            onClick={() => setFormat('image/webp')}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${format === 'image/webp'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                }`}
                        >
                            WebP
                        </button>
                    </div>
                </div>

                {/* Quality Control (for JPEG/WebP) */}
                {(format === 'image/jpeg' || format === 'image/webp') && (
                    <div className="space-y-2">
                        <Slider
                            label="Quality"
                            valueDisplay={`${quality}%`}
                            min={1}
                            max={100}
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                        />
                    </div>
                )}

                {/* Resize Options */}
                <div className="space-y-4">
                    <label className="text-sm font-bold text-muted-foreground uppercase">Resize (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Width (px)</label>
                            <input
                                type="number"
                                value={width || ''}
                                onChange={(e) => setWidth(Number(e.target.value))}
                                placeholder="Auto"
                                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Height (px)</label>
                            <input
                                type="number"
                                value={height || ''}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                placeholder="Auto"
                                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Maintain Aspect Ratio</label>
                        <input
                            type="checkbox"
                            checked={maintainAspectRatio}
                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Background Color (for non-PNG) */}
                {format !== 'image/png' && (
                    <ColorPicker
                        label="Background Color"
                        color={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                    />
                )}
            </div>

            <div className="p-4 md:p-6 border-t border-border bg-card space-y-3">
                <button
                    onClick={onExportSingle}
                    disabled={!hasImages}
                    className="w-full py-2 md:py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    Convert & Download
                </button>
                <button
                    onClick={onExportBatch}
                    disabled={!hasImages}
                    className="w-full py-2 md:py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Archive size={18} />
                    Download All (ZIP)
                </button>
            </div>
        </aside>
    )
}
