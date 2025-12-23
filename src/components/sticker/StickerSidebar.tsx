import React from "react"
import { Slider } from "@/components/ui/Slider"
import { ColorPicker } from "@/components/ui/ColorPicker"
import {
    Download,
    Archive,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Settings2,
    Image as ImageIcon
} from "lucide-react"

interface StickerSidebarProps {
    // State
    borderSize: number
    setBorderSize: (v: number) => void
    borderColor: string
    setBorderColor: (v: string) => void

    // Navigation
    hasImages: boolean
    currentFileName: string
    onNext: () => void
    onPrev: () => void

    // Actions
    onExportPng: () => void
    onExportZip: () => void
    onEnterSheetMode: () => void
    onReset: () => void

    // Sheet Mode Props (optional or separate?)
    isSheetMode: boolean
    sheetSettings?: {
        globalWidth: number
        setGlobalWidth: (v: number) => void
        applyGlobalWidth: () => void
        sheetType: "a4" | "custom"
        setSheetType: (v: "a4" | "custom") => void
        customW: number
        setCustomW: (v: number) => void
        customH: number
        setCustomH: (v: number) => void
        onExportSheet: () => void
        onExitSheetMode: () => void
    }
}

export function StickerSidebar({
    borderSize, setBorderSize,
    borderColor, setBorderColor,
    hasImages, currentFileName,
    onNext, onPrev,
    onExportPng, onExportZip, onEnterSheetMode,
    onReset,
    isSheetMode,
    sheetSettings
}: StickerSidebarProps) {

    if (isSheetMode && sheetSettings) {
        return (
            <div className="w-full md:w-80 bg-card border-r border-border p-4 md:p-6 flex flex-col gap-6 overflow-y-auto h-[40vh] md:h-full z-10 shadow-sm">
                <div className="flex items-center gap-2 text-primary mb-2">
                    <LayoutGrid size={20} />
                    <h2 className="font-bold text-lg">Sheet Layout</h2>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Set All Width (cm)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={sheetSettings.globalWidth || ''}
                                placeholder="cm"
                                step="0.1"
                                onChange={(e) => sheetSettings.setGlobalWidth(parseFloat(e.target.value))}
                                className="flex-1 p-2 rounded-md border border-input bg-background text-sm"
                            />
                            <button
                                onClick={sheetSettings.applyGlobalWidth}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                            >
                                Set
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Sheet Size
                        </label>
                        <select
                            value={sheetSettings.sheetType}
                            onChange={(e) => sheetSettings.setSheetType(e.target.value as any)}
                            className="w-full p-2 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="a4">A4 (21 x 29.7 cm)</option>
                            <option value="custom">Custom Size</option>
                        </select>

                        {sheetSettings.sheetType === 'custom' && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">Width (cm)</label>
                                    <input
                                        type="number"
                                        value={sheetSettings.customW}
                                        onChange={(e) => sheetSettings.setCustomW(parseFloat(e.target.value))}
                                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={sheetSettings.customH}
                                        onChange={(e) => sheetSettings.setCustomH(parseFloat(e.target.value))}
                                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto space-y-3">
                    <button
                        onClick={sheetSettings.onExportSheet}
                        className="w-full px-4 py-2 md:py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <Download size={18} />
                        Save Artboard
                    </button>
                    <button
                        onClick={sheetSettings.onExitSheetMode}
                        className="w-full px-4 py-2 md:py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors"
                    >
                        Back to Editor
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full md:w-80 bg-card border-r border-border p-4 md:p-6 flex flex-col gap-6 overflow-y-auto h-[40vh] md:h-full z-10 shadow-sm">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Current File</h2>
                <div className={`p-3 rounded-lg bg-secondary/50 border border-border text-sm font-medium text-primary truncate ${hasImages ? 'opacity-100' : 'opacity-50'}`}>
                    {hasImages ? currentFileName : "No file loaded"}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary">
                    <Settings2 size={18} />
                    <h3 className="font-semibold">Sticker Settings</h3>
                </div>

                <div className="space-y-4">
                    <Slider
                        label="Border Size"
                        valueDisplay={`${borderSize}px`}
                        min={0}
                        max={150}
                        value={borderSize}
                        onChange={(e) => setBorderSize(parseInt(e.target.value))}
                    />

                    <ColorPicker
                        label="Border Color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onPrev}
                    disabled={!hasImages}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                    <ChevronLeft size={16} /> Prev
                </button>
                <button
                    onClick={onNext}
                    disabled={!hasImages}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
                >
                    Next <ChevronRight size={16} />
                </button>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-3">
                <button
                    onClick={onExportPng}
                    disabled={!hasImages}
                    className="w-full px-4 py-2 md:py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Download size={18} />
                    Export PNG
                </button>
                <button
                    onClick={onExportZip}
                    disabled={!hasImages}
                    className="w-full px-4 py-2 md:py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Archive size={18} />
                    Download ZIP
                </button>
            </div>

            <div className="h-px bg-border" />

            <button
                onClick={onEnterSheetMode}
                disabled={!hasImages}
                className="w-full px-4 py-2 md:py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <LayoutGrid size={18} />
                Organize Artboard
            </button>

            <div className="mt-auto">
                <button
                    onClick={onReset}
                    className="w-full px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                    <RefreshCw size={14} />
                    New Session
                </button>
            </div>
        </div>
    )
}
