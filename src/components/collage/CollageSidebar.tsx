import React from "react"
import { Slider } from "@/components/ui/Slider"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { COLLAGE_LAYOUTS, ASPECT_RATIOS } from "./CollageLayouts"
import { Layout, Download, Square, Smartphone, Monitor } from "lucide-react"

interface CollageSidebarProps {
    layoutId: string
    setLayoutId: (id: string) => void
    aspectRatioId: string
    setAspectRatioId: (id: string) => void
    spacing: number
    setSpacing: (n: number) => void
    borderRadius: number
    setBorderRadius: (n: number) => void
    background: string
    setBackground: (s: string) => void
    customSize: { w: number, h: number }
    setCustomSize: (s: { w: number, h: number }) => void
    onExport: () => void
}

export function CollageSidebar({
    layoutId, setLayoutId,
    aspectRatioId, setAspectRatioId,
    spacing, setSpacing,
    borderRadius, setBorderRadius,
    background, setBackground,
    customSize, setCustomSize,
    onExport
}: CollageSidebarProps) {
    return (
        <aside className="w-80 shrink-0 bg-card border-r border-border flex flex-col h-full z-30 shadow-xl">
            <div className="p-6 border-b border-border">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <Layout size={20} />
                    Collage Maker
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Combine your photos</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Layouts */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                        {COLLAGE_LAYOUTS.map(layout => (
                            <button
                                key={layout.id}
                                onClick={() => setLayoutId(layout.id)}
                                className={`aspect-square rounded-lg border-2 flex items-center justify-center p-2 transition-all ${layoutId === layout.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                    }`}
                                title={layout.label}
                            >
                                <div className="w-full h-full relative bg-muted/20 p-0.5">
                                    {layout.slots.map(slot => (
                                        <div
                                            key={slot.id}
                                            className="bg-current opacity-30 rounded-[1px]"
                                            style={{
                                                width: `${slot.w}%`,
                                                height: `${slot.h}%`,
                                                position: 'absolute',
                                                left: `${slot.x}%`,
                                                top: `${slot.y}%`,
                                                // Simple visual approximation for the icon
                                                border: '1px solid white'
                                            }}
                                        />
                                    ))}
                                    {/* Fallback icon if CSS grid is too complex for mini preview */}
                                    <Layout size={16} className="m-auto opacity-50" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Size</label>
                    <div className="grid grid-cols-2 gap-2">
                        {ASPECT_RATIOS.map(ratio => (
                            <button
                                key={ratio.id}
                                onClick={() => setAspectRatioId(ratio.id)}
                                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${aspectRatioId === ratio.id
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                    }`}
                            >
                                {ratio.id === '1:1' && <Square size={14} />}
                                {ratio.id === '9:16' && <Smartphone size={14} />}
                                {ratio.id === '16:9' && <Monitor size={14} />}
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Style Controls */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Spacing</label>
                        <Slider
                            value={spacing}
                            min={0}
                            max={100}
                            onChange={(e) => setSpacing(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Roundness</label>
                        <Slider
                            value={borderRadius}
                            min={0}
                            max={100}
                            onChange={(e) => setBorderRadius(Number(e.target.value))}
                        />
                    </div>
                    <ColorPicker
                        label="Background"
                        color={background}
                        onChange={(e) => setBackground(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-6 border-t border-border bg-card">
                <button
                    onClick={onExport}
                    className="w-full py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                    <Download size={18} />
                    Export Collage
                </button>
            </div>
        </aside>
    )
}
