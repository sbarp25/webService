"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, QrCode, ScanLine } from "lucide-react"
import { QRGenerator } from "@/components/qr/QRGenerator"
import { QRScanner } from "@/components/qr/QRScanner"

export default function QRCodePage() {
    const [activeTab, setActiveTab] = useState<'generate' | 'scan'>('generate')

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-border bg-card flex items-center px-6 gap-4 sticky top-0 z-50">
                <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                    <QrCode size={24} />
                    QR Code Studio
                </h1>
            </header>

            <main className="flex-1 container mx-auto p-6 max-w-5xl">
                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="bg-secondary/50 p-1 rounded-full flex gap-1">
                        <button
                            onClick={() => setActiveTab('generate')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'generate'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            <QrCode size={16} />
                            Generate
                        </button>
                        <button
                            onClick={() => setActiveTab('scan')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'scan'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            <ScanLine size={16} />
                            Scan
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'generate' ? (
                        <QRGenerator />
                    ) : (
                        <QRScanner />
                    )}
                </div>
            </main>
        </div>
    )
}
