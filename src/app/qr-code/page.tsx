"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, QrCode, ScanLine, Zap, Lock } from "lucide-react"
import { QRGenerator } from "@/components/qr/QRGenerator"
import { QRScanner } from "@/components/qr/QRScanner"

export default function QRCodePage() {
    const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'dynamic'>('generate')
    const { data: session } = useSession()
    const router = useRouter()

    const handleDynamicClick = () => {
        if (!session) {
            // Show login prompt
            if (confirm('Dynamic QR codes require an account. Would you like to sign in?')) {
                router.push('/login')
            }
        } else {
            router.push('/dashboard/create')
        }
    }

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
                {session && (
                    <Link
                        href="/dashboard"
                        className="ml-auto px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                        My QR Codes
                    </Link>
                )}
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
                            Static QR
                        </button>
                        <button
                            onClick={() => setActiveTab('dynamic')}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dynamic'
                                ? 'bg-background shadow-sm text-primary'
                                : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            <Zap size={16} />
                            Dynamic QR
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
                    {activeTab === 'generate' && <QRGenerator />}
                    {activeTab === 'scan' && <QRScanner />}
                    {activeTab === 'dynamic' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                                    <Zap className="text-primary" size={32} />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Dynamic QR Codes</h2>
                                    <p className="text-muted-foreground">
                                        Create QR codes that you can update anytime without regenerating
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="bg-card/50 rounded-xl p-4">
                                        <div className="font-semibold mb-1">✨ Editable Content</div>
                                        <p className="text-sm text-muted-foreground">Change destination URL without reprinting</p>
                                    </div>
                                    <div className="bg-card/50 rounded-xl p-4">
                                        <div className="font-semibold mb-1">📊 Analytics</div>
                                        <p className="text-sm text-muted-foreground">Track scans, devices, and locations</p>
                                    </div>
                                    <div className="bg-card/50 rounded-xl p-4">
                                        <div className="font-semibold mb-1">🔗 Bio Pages</div>
                                        <p className="text-sm text-muted-foreground">Linktree-style landing pages</p>
                                    </div>
                                    <div className="bg-card/50 rounded-xl p-4">
                                        <div className="font-semibold mb-1">⚡ Short URLs</div>
                                        <p className="text-sm text-muted-foreground">Clean, shareable links</p>
                                    </div>
                                </div>

                                {!session ? (
                                    <div className="space-y-3 pt-4">
                                        <button
                                            onClick={handleDynamicClick}
                                            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                        >
                                            <Lock size={18} />
                                            Sign In to Create Dynamic QR
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            Free account required • Sign in with Google
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDynamicClick}
                                        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                    >
                                        Create Dynamic QR Code
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
