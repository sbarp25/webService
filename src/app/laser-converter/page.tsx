
'use client'

import React, { useState, useRef } from 'react'
import { LaserSidebar } from '@/components/laser/LaserSidebar'
import { LaserEditor } from '@/components/laser/LaserEditor'
import { LaserSettings, DEFAULT_LASER_SETTINGS } from '@/lib/laser-utils'

export default function LaserConverterPage() {
    const [file, setFile] = useState<File | null>(null)
    const [settings, setSettings] = useState<LaserSettings>(DEFAULT_LASER_SETTINGS)
    const [isProcessing, setIsProcessing] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const handleDownload = () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const url = canvas.toDataURL('image/png')
        const link = document.createElement('a')

        // Generate filename
        const originalName = file?.name.split('.')[0] || 'image'
        link.download = `${originalName}_laser_${settings.algorithm}.png`
        link.href = url
        link.click()
    }

    const handleReset = () => {
        setFile(null)
        setSettings(DEFAULT_LASER_SETTINGS)
        // Reset file input if necessary (but we use custom button so simple state reset is enough)
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] bg-background">
            <LaserSidebar
                settings={settings}
                setSettings={setSettings}
                isProcessing={isProcessing}
                onDownload={handleDownload}
                onReset={handleReset}
                hasImage={!!file}
            />

            <LaserEditor
                file={file}
                settings={settings}
                onUpload={setFile}
                onProcessStart={() => setIsProcessing(true)}
                onProcessEnd={() => setIsProcessing(false)}
                canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
            />
        </div>
    )
}
