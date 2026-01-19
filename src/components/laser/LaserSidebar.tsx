
import React from "react"
import { Slider } from "@/components/ui/Slider"
import { LaserSettings } from "@/lib/laser-utils"
import { Download, Zap, SlidersHorizontal, Image as ImageIcon } from "lucide-react"

interface LaserSidebarProps {
    settings: LaserSettings
    setSettings: (settings: LaserSettings) => void
    isProcessing: boolean
    onDownload: () => void
    onReset: () => void
    hasImage: boolean
}

export function LaserSidebar({
    settings,
    setSettings,
    isProcessing,
    onDownload,
    onReset,
    hasImage
}: LaserSidebarProps) {

    const updateSetting = <K extends keyof LaserSettings>(key: K, value: LaserSettings[K]) => {
        setSettings({ ...settings, [key]: value })
    }

    return (
        <aside className="w-full md:w-80 bg-card border-r border-border flex flex-col h-[40vh] md:h-full z-20 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-border hidden md:block">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <Zap size={20} />
                    Laser Prep
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Prepare images for engraving</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

                {/* Algorithm Selection */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                        <SlidersHorizontal size={18} />
                        <h3 className="font-semibold">Algorithm</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {(['threshold', 'floyd-steinberg', 'atkinson', 'burkes', 'sierra', 'halftone'] as const).map((algo) => (
                            <button
                                key={algo}
                                onClick={() => updateSetting('algorithm', algo)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left capitalize ${settings.algorithm === algo
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                    }`}
                            >
                                {algo.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Controls */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Invert Colors</label>
                        <input
                            type="checkbox"
                            checked={settings.inverted}
                            onChange={(e) => updateSetting('inverted', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>

                    <Slider
                        label="Brightness"
                        value={settings.brightness}
                        min={-100}
                        max={100}
                        step={1}
                        onChange={(e) => updateSetting('brightness', Number(e.target.value))}
                        valueDisplay={`${settings.brightness}`}
                    />

                    <Slider
                        label="Contrast"
                        value={settings.contrast}
                        min={-100}
                        max={100}
                        step={1}
                        onChange={(e) => updateSetting('contrast', Number(e.target.value))}
                        valueDisplay={`${settings.contrast}`}
                    />

                    {/* Threshold specific control (or maybe always show as bias?) */}
                    {/* For error diffusion, threshold is usually fixed at 128, but we can allow shifting it */}
                    <Slider
                        label="Threshold"
                        value={settings.threshold}
                        min={0}
                        max={255}
                        step={1}
                        onChange={(e) => updateSetting('threshold', Number(e.target.value))}
                        valueDisplay={`${settings.threshold}`}
                    />

                    <Slider
                        label="Scale (Quality)"
                        value={settings.scale}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        onChange={(e) => updateSetting('scale', Number(e.target.value))}
                        valueDisplay={`${Math.round(settings.scale * 100)}%`}
                    />

                    {settings.algorithm === 'halftone' && (
                        <Slider
                            label="Dot Grid Size"
                            value={settings.gridSize || 6}
                            min={2}
                            max={20}
                            step={1}
                            onChange={(e) => updateSetting('gridSize', Number(e.target.value))}
                            valueDisplay={`${settings.gridSize || 6}px`}
                        />
                    )}
                </div>
            </div>

            <div className="p-4 md:p-6 border-t border-border bg-card space-y-3">
                <button
                    onClick={onDownload}
                    disabled={!hasImage || isProcessing}
                    className="w-full py-2 md:py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <Download size={18} />
                            Download PNG
                        </>
                    )}
                </button>

                {hasImage && (
                    <button
                        onClick={onReset}
                        className="w-full py-2 md:py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 border border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                    >
                        New Image
                    </button>
                )}
            </div>
        </aside>
    )
}
