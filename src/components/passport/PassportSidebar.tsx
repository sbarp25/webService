import React from "react"
import { Slider } from "@/components/ui/Slider"
import { PASSPORT_STANDARDS, PAPER_SIZES, PassportStandard } from "@/lib/passport-utils"
import { Download, RotateCcw, Save, Grid } from "lucide-react"

interface PassportSidebarProps {
    standard: PassportStandard
    setStandard: (s: PassportStandard) => void
    zoom: number
    setZoom: (z: number) => void
    rotation: number
    setRotation: (r: number) => void
    paperSizeId: string
    setPaperSizeId: (id: string) => void
    onExportSingle: () => void
    onExportSheet: () => void
    hasImage: boolean
}

export function PassportSidebar({
    standard, setStandard,
    zoom, setZoom,
    rotation, setRotation,
    paperSizeId, setPaperSizeId,
    onExportSingle, onExportSheet,
    hasImage
}: PassportSidebarProps) {
    return (
        <aside className="w-80 bg-card border-r border-border flex flex-col h-full z-20 shadow-xl">
            <div className="p-6 border-b border-border">
                <h2 className="font-bold text-xl text-primary flex items-center gap-2">
                    <Grid size={20} />
                    Passport Maker
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Create official ID photos</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Standard Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Photo Standard</label>
                    <div className="grid grid-cols-1 gap-2">
                        {PASSPORT_STANDARDS.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStandard(s)}
                                className={`px-3 py-2 rounded-lg text-left text-sm transition-all border ${standard.id === s.id
                                    ? "bg-primary/10 border-primary text-primary font-medium"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground"
                                    }`}
                            >
                                <div className="font-medium">{s.label}</div>
                                <div className="text-[10px] opacity-70">{s.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor Controls */}
                <div className="space-y-6">
                    <Slider
                        label="Zoom"
                        value={zoom}
                        min={50}
                        max={300}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        disabled={!hasImage}
                    />
                    <Slider
                        label="Rotation"
                        value={rotation}
                        min={-45}
                        max={45}
                        onChange={(e) => setRotation(Number(e.target.value))}
                        disabled={!hasImage}
                    />
                </div>

                {/* Paper Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Print Paper Size</label>
                    <select
                        value={paperSizeId}
                        onChange={(e) => setPaperSizeId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-secondary/50 border-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                        {PAPER_SIZES.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-6 border-t border-border space-y-3 bg-card">
                <button
                    onClick={onExportSingle}
                    disabled={!hasImage}
                    className="w-full py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={18} />
                    Save Single Photo
                </button>
                <button
                    onClick={onExportSheet}
                    disabled={!hasImage}
                    className="w-full py-2.5 rounded-full font-medium transition-all flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    Save Printable Sheet
                </button>
            </div>
        </aside>
    )
}
