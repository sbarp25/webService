"use client"

import React, { useState, useRef } from "react"
import { CollageSidebar } from "@/components/collage/CollageSidebar"
import { CollageCanvas } from "@/components/collage/CollageCanvas"
import { COLLAGE_LAYOUTS, ASPECT_RATIOS } from "@/components/collage/CollageLayouts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CollagePage() {
    const [layoutId, setLayoutId] = useState(COLLAGE_LAYOUTS[0].id)
    const [aspectRatioId, setAspectRatioId] = useState(ASPECT_RATIOS[0].id)
    const [customSize, setCustomSize] = useState({ w: 1080, h: 1080 })
    const [spacing, setSpacing] = useState(20)
    const [borderRadius, setBorderRadius] = useState(10)
    const [background, setBackground] = useState('#ffffff')
    const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({})

    const canvasRef = useRef<HTMLCanvasElement>(null)

    const currentLayout = COLLAGE_LAYOUTS.find(l => l.id === layoutId) || COLLAGE_LAYOUTS[0]
    const currentRatio = aspectRatioId === 'custom'
        ? customSize
        : ASPECT_RATIOS.find(r => r.id === aspectRatioId) || ASPECT_RATIOS[0]

    const handleExport = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const link = document.createElement('a')
        link.download = `collage_${layoutId}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <CollageSidebar
                layoutId={layoutId}
                setLayoutId={setLayoutId}
                aspectRatioId={aspectRatioId}
                setAspectRatioId={setAspectRatioId}
                spacing={spacing}
                setSpacing={setSpacing}
                borderRadius={borderRadius}
                setBorderRadius={setBorderRadius}
                background={background}
                setBackground={setBackground}
                customSize={customSize}
                setCustomSize={setCustomSize}
                onExport={handleExport}
            />

            <div className="flex-1 relative flex flex-col">
                <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 z-10">
                    <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-primary">Collage Maker</h1>
                </header>

                <div className="flex-1 relative overflow-hidden">
                    <CollageCanvas
                        layout={currentLayout}
                        width={currentRatio.w}
                        height={currentRatio.h}
                        spacing={spacing}
                        borderRadius={borderRadius}
                        background={background}
                        images={images}
                        setImages={setImages}
                        canvasRef={canvasRef}
                    />
                </div>
            </div>
        </div>
    )
}
