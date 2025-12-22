import React, { useRef } from "react"
import { Slider } from "@/components/ui/Slider"
import { ColorPicker } from "@/components/ui/ColorPicker"
import { WatermarkSettings } from "@/lib/watermark-utils"
import { Download, Type, Image as ImageIcon, Grid, LayoutGrid, Move } from "lucide-react"

interface WatermarkSidebarProps {
    settings: WatermarkSettings
    updateSettings: (s: Partial<WatermarkSettings>) => void
    onExport: () => void
    hasImage: boolean
}

export function WatermarkSidebar({
    settings, updateSettings, onExport, hasImage
}: WatermarkSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const img = new Image()
            img.onload = () => {
                updateSettings({ image: img, type: 'image' })
            }
            img.src = URL.createObjectURL(file)
        }
    }

    return (
        <aside className="w-80 bg-card border-r border-border flex flex-col h-full z-20 shadow-xl">
            <div className="p-6 border-b border-border">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <LayoutGrid size={20} />
                    Watermark Tool
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Protect your images</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Type Selection */}
                <div className="flex bg-secondary/50 p-1 rounded-lg">
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${settings.type === 'text' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => updateSettings({ type: 'text' })}
                    >
                        <Type size={16} /> Text
                    </button>
                    <button
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${settings.type === 'image' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        onClick={() => updateSettings({ type: 'image' })}
                    >
                        <ImageIcon size={16} /> Image
                    </button>
                </div>

                {/* Content Controls */}
                {settings.type === 'text' ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Text</label>
                            <input
                                type="text"
                                value={settings.text}
                                onChange={(e) => updateSettings({ text: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Font Size</label>
                            <Slider
                                value={settings.fontSize}
                                min={1}
                                max={1000}
                                onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                            />
                        </div>
                        <ColorPicker
                            label="Color"
                            color={settings.color}
                            onChange={(e) => updateSettings({ color: e.target.value })}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Logo Image</label>
                            <div
                                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {settings.image ? (
                                    <div className="text-xs text-primary font-medium">Change Image</div>
                                ) : (
                                    <div className="text-xs text-muted-foreground">Click to Upload</div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Scale</label>
                            <Slider
                                value={settings.imageScale}
                                min={10}
                                max={200}
                                onChange={(e) => updateSettings({ imageScale: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                )}

                {/* Common Controls */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Opacity</label>
                        <Slider
                            value={settings.opacity * 100}
                            min={0}
                            max={100}
                            onChange={(e) => updateSettings({ opacity: Number(e.target.value) / 100 })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Rotation</label>
                        <Slider
                            value={settings.rotation}
                            min={-180}
                            max={180}
                            onChange={(e) => updateSettings({ rotation: Number(e.target.value) })}
                        />
                    </div>

                    {/* Spacing Control */}
                    {(settings.isTiled || settings.type === 'text') && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">
                                {settings.isTiled ? 'Tile Spacing' : 'Letter Spacing'}
                            </label>
                            <Slider
                                value={settings.isTiled ? settings.tileGap : settings.letterSpacing}
                                min={settings.isTiled ? 0 : -5}
                                max={settings.isTiled ? 200 : 50}
                                onChange={(e) => {
                                    const val = Number(e.target.value)
                                    if (settings.isTiled) {
                                        updateSettings({ tileGap: val })
                                    } else {
                                        updateSettings({ letterSpacing: val })
                                    }
                                }}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Tile Watermark</label>
                        <input
                            type="checkbox"
                            checked={settings.isTiled}
                            onChange={(e) => updateSettings({ isTiled: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                    </div>

                    {!settings.isTiled && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">Position</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['top-left', 'center', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                                    <button
                                        key={pos}
                                        onClick={() => updateSettings({ position: pos as any, customX: 0, customY: 0 })}
                                        className={`p-2 rounded border text-[10px] uppercase ${settings.position === pos
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-secondary/30 border-transparent hover:bg-secondary'
                                            }`}
                                    >
                                        {pos.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-border bg-card">
                <button
                    onClick={onExport}
                    disabled={!hasImage}
                    className="w-full py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    Export All
                </button>
            </div>
        </aside>
    )
}
