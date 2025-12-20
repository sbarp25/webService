import React from "react"
import { Slider } from "@/components/ui/Slider"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { RotateCw, ZoomIn, Maximize, FileOutput, Image as ImageIcon } from "lucide-react"

interface CropperSidebarProps {
    zoom: number
    setZoom: (v: number) => void
    rotation: number
    setRotation: (v: number) => void
    borderWidth: number
    setBorderWidth: (v: number) => void
    borderColor: string
    setBorderColor: (v: string) => void
    isBgTransparent: boolean
    setIsBgTransparent: (v: boolean) => void
    bgColor: string
    setBgColor: (v: string) => void
    outputSize: number
    setOutputSize: (v: number) => void
    outputFormat: "image/png" | "image/webp"
    setOutputFormat: (v: "image/png" | "image/webp") => void
    onSave: () => void
    onSkip: () => void
    onReset: () => void
    hasImage: boolean
    fileName: string
}

export function CropperSidebar({
    zoom, setZoom,
    rotation, setRotation,
    borderWidth, setBorderWidth,
    borderColor, setBorderColor,
    isBgTransparent, setIsBgTransparent,
    bgColor, setBgColor,
    outputSize, setOutputSize,
    outputFormat, setOutputFormat,
    onSave, onSkip, onReset,
    hasImage, fileName
}: CropperSidebarProps) {
    return (
        <div className="w-full md:w-80 bg-card border-r border-border p-6 flex flex-col gap-8 overflow-y-auto h-full z-10 shadow-sm">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">File Info</h2>
                <div className={`p-3 rounded-lg bg-secondary/50 border border-border text-sm font-medium text-primary transition-opacity duration-300 ${hasImage ? 'opacity-100' : 'opacity-50'}`}>
                    {hasImage ? fileName : "No file loaded"}
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <FileOutput size={18} />
                        <h3 className="font-semibold">Output Settings</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground">Size (px)</label>
                            <input
                                type="number"
                                value={outputSize || ''}
                                placeholder="Auto"
                                onChange={(e) => setOutputSize(parseInt(e.target.value) || 0)}
                                className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                min={50}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground">Format</label>
                            <select
                                value={outputFormat}
                                onChange={(e) => setOutputFormat(e.target.value as any)}
                                className="w-full p-2 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="image/png">PNG</option>
                                <option value="image/webp">WebP</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <ImageIcon size={18} />
                        <h3 className="font-semibold">Image Controls</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isBgTransparent}
                                    onChange={(e) => setIsBgTransparent(e.target.checked)}
                                    className="w-4 h-4 accent-primary rounded"
                                />
                                Transparent Background
                            </label>
                            <ColorPicker
                                disabled={isBgTransparent}
                                value={bgColor}
                                onChange={(e) => setBgColor(e.target.value)}
                                className={isBgTransparent ? "opacity-50 cursor-not-allowed" : ""}
                            />
                        </div>

                        <Slider
                            label="Zoom"
                            valueDisplay={`${Math.round(zoom)}%`}
                            min={10}
                            max={400}
                            value={zoom}
                            onChange={(e) => setZoom(parseInt(e.target.value))}
                        />

                        <Slider
                            label="Rotation"
                            valueDisplay={`${rotation}°`}
                            min={0}
                            max={360}
                            value={rotation}
                            onChange={(e) => setRotation(parseInt(e.target.value))}
                        />

                        <Slider
                            label="Border Width"
                            valueDisplay={`${borderWidth}px`}
                            min={0}
                            max={50}
                            value={borderWidth}
                            onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                        />

                        <ColorPicker
                            label="Border Color"
                            value={borderColor}
                            onChange={(e) => setBorderColor(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={onSkip}
                        className="col-span-1 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors text-sm"
                    >
                        Skip
                    </button>
                    <button
                        onClick={onSave}
                        disabled={!hasImage}
                        className="col-span-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        Save & Next
                    </button>
                </div>
                <button
                    onClick={onReset}
                    className="w-full px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
                >
                    Reset Image
                </button>
            </div>
        </div>
    )
}
