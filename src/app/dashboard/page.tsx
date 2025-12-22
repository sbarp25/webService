"use client"

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Plus, QrCode, BarChart3, Settings, LogOut, Loader2 } from 'lucide-react'

interface QRCodeData {
    id: string
    shortCode: string
    name: string
    type: string
    scans: number
    isActive: boolean
    createdAt: string
    url: string
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            fetchQRCodes()
        }
    }, [status, router])

    const fetchQRCodes = async () => {
        try {
            const res = await fetch('/api/qr/list')
            const data = await res.json()
            if (data.success) {
                setQrCodes(data.qrCodes)
            }
        } catch (error) {
            console.error('Error fetching QR codes:', error)
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <QrCode className="text-primary" size={24} />
                        <h1 className="text-xl font-bold">Dynamic QR</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <img
                                src={session?.user?.image || ''}
                                alt={session?.user?.name || ''}
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="text-sm font-medium hidden sm:block">{session?.user?.name}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total QR Codes</p>
                                <p className="text-3xl font-bold mt-1">{qrCodes.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <QrCode className="text-primary" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Scans</p>
                                <p className="text-3xl font-bold mt-1">
                                    {qrCodes.reduce((sum, qr) => sum + qr.scans, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                                <BarChart3 className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active QR Codes</p>
                                <p className="text-3xl font-bold mt-1">
                                    {qrCodes.filter(qr => qr.isActive).length}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Settings className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Codes List */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Your QR Codes</h2>
                    <button
                        onClick={() => router.push('/dashboard/create')}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} />
                        Create New
                    </button>
                </div>

                {qrCodes.length === 0 ? (
                    <div className="bg-card border border-dashed rounded-2xl p-12 text-center">
                        <QrCode className="mx-auto text-muted-foreground mb-4" size={48} />
                        <h3 className="text-xl font-semibold mb-2">No QR codes yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first dynamic QR code to get started</p>
                        <button
                            onClick={() => router.push('/dashboard/create')}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Create Your First QR Code
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {qrCodes.map((qr) => (
                            <div key={qr.id} className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{qr.name}</h3>
                                        <p className="text-sm text-muted-foreground capitalize">{qr.type}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${qr.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {qr.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Short Code</p>
                                    <p className="font-mono font-bold">{qr.shortCode}</p>
                                </div>

                                <div className="flex items-center justify-between text-sm mb-4">
                                    <span className="text-muted-foreground">Scans</span>
                                    <span className="font-semibold">{qr.scans}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/dashboard/${qr.id}`)}
                                        className="flex-1 bg-primary/10 text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                                        View
                                    </button>
                                    <button
                                        onClick={() => router.push(`/dashboard/${qr.id}/edit`)}
                                        className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
