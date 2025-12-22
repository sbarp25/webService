"use client"

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Download, ExternalLink, Pencil, QrCode, Calendar, BarChart3, Globe, Copy, Check, Hash, ToggleLeft, ToggleRight, Wifi, AlignLeft } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface QRScanHistory {
    timestamp: string
    userAgent?: string
    ip?: string
    country?: string
    city?: string
}

interface QRCodeDetails {
    id: string
    shortCode: string
    name: string
    type: string
    content: any
    isActive: boolean
    scans: number
    scanHistory: QRScanHistory[]
    createdAt: string
    updatedAt: string
    url: string
}

export default function QRDetailsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const [qrCode, setQrCode] = useState<QRCodeDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [isStatic, setIsStatic] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && params?.id) {
            fetchQRDetails(params.id as string)
        }
    }, [status, router, params])

    const fetchQRDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/qr/${id}`)
            const data = await res.json()
            if (data.success) {
                setQrCode(data.qrCode)
            } else {
                setError(data.error || 'Failed to load QR code')
            }
        } catch (error) {
            console.error('Error fetching QR details:', error)
            setError('An error occurred while loading details')
        } finally {
            setLoading(false)
        }
    }

    const downloadQR = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${qrCode?.name || 'qrcode'}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }

    const copyToClipboard = async () => {
        if (qrCode?.url) {
            await navigator.clipboard.writeText(String(qrCode.url));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    // Compute the value to encode in the QR code
    const getQRValue = () => {
        if (!qrCode) return '';

        if (!isStatic) {
            // Dynamic Mode: Always use the redirect URL
            return String(qrCode.url);
        }

        // Static Mode: Format content based on type
        try {
            switch (qrCode.type) {
                case 'wifi':
                    const ssid = qrCode.content.ssid || '';
                    const pass = qrCode.content.password || '';
                    const enc = qrCode.content.encryption || 'WPA';
                    return `WIFI:S:${ssid};T:${enc};P:${pass};;`;

                case 'vcard':
                    const n = `${qrCode.content.lastName || ''};${qrCode.content.firstName || ''};;;`;
                    const fn = `${qrCode.content.firstName || ''} ${qrCode.content.lastName || ''}`.trim();
                    const tel = qrCode.content.phone ? `TEL;TYPE=CELL:${qrCode.content.phone}` : '';
                    const email = qrCode.content.email ? `EMAIL:${qrCode.content.email}` : '';
                    const org = qrCode.content.company ? `ORG:${qrCode.content.company}` : '';
                    const title = qrCode.content.jobTitle ? `TITLE:${qrCode.content.jobTitle}` : '';
                    const urlV = qrCode.content.website ? `URL:${qrCode.content.website}` : '';
                    const adr = qrCode.content.address ? `ADR:;;${qrCode.content.address.replace(/\n/g, ';')};;;;` : '';

                    return [
                        'BEGIN:VCARD',
                        'VERSION:3.0',
                        `N:${n}`,
                        `FN:${fn}`,
                        org,
                        title,
                        tel,
                        email,
                        urlV,
                        adr,
                        'END:VCARD'
                    ].filter(Boolean).join('\n');

                case 'biopage':
                    // Bio pages are inherently web-based, so Static = Dynamic URL
                    return String(qrCode.url);

                case 'url':
                    const url = typeof qrCode.content === 'string' ? qrCode.content : (qrCode.content.url || '');
                    return url;

                case 'text':
                    const text = typeof qrCode.content === 'string' ? qrCode.content : (qrCode.content.text || '');
                    return text;

                default:
                    // Fallback to URL if unknown
                    return String(qrCode.url);
            }
        } catch (e) {
            return String(qrCode.url);
        }
    }

    const qrValue = getQRValue();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error || !qrCode) {
        return (
            <div className="min-h-screen container mx-auto p-4 flex flex-col items-center justify-center">
                <p className="text-red-500 mb-4">{error || 'QR Code not found'}</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-primary hover:underline"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold">{String(qrCode.name)}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${qrCode.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {qrCode.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <button
                        onClick={() => router.push(`/dashboard/${qrCode.id}/edit`)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Pencil size={16} />
                        Edit QR
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: QR Info & Stats */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-card border rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <BarChart3 size={20} />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Scans</p>
                                </div>
                                <p className="text-2xl font-bold">{Number(qrCode.scans)}</p>
                            </div>
                            <div className="bg-card border rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                        <Calendar size={20} />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Created</p>
                                </div>
                                <p className="text-sm font-medium">
                                    {new Date(qrCode.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-card border rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                        <Globe size={20} />
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Type</p>
                                </div>
                                <p className="text-lg font-medium capitalize">{String(qrCode.type)}</p>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-card border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1">Target URL</label>
                                    <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg border">
                                        <ExternalLink size={16} className="text-muted-foreground" />
                                        <a href={String(qrCode.content)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate flex-1">
                                            {/* Safely render content object if complex */}
                                            {typeof qrCode.content === 'object' ? JSON.stringify(qrCode.content) : String(qrCode.content)}
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1">Short Link</label>
                                    <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-lg border">
                                        <span className="text-muted-foreground font-mono flex-1">{String(qrCode.url)}</span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Scans */}
                        <div className="bg-card border rounded-xl p-6">
                            <h2 className="text-lg font-semibold mb-4">Scan History</h2>
                            {qrCode.scanHistory && qrCode.scanHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {qrCode.scanHistory.slice(0, 5).map((scan, index) => (
                                        <div key={index} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                                            <div>
                                                <p className="font-medium text-sm">Scan from {String(scan.country || 'Unknown Location')}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(scan.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                                {String(scan.city || 'Unknown City')}
                                            </div>
                                        </div>
                                    ))}
                                    {qrCode.scanHistory.length > 5 && (
                                        <div className="text-center pt-2">
                                            <p className="text-xs text-muted-foreground">And {qrCode.scanHistory.length - 5} more...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No scans yet</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center">
                                <div className="flex items-center justify-between w-full mb-6">
                                    <h2 className="text-lg font-semibold">QR Preview</h2>
                                    <button
                                        onClick={() => setIsStatic(!isStatic)}
                                        className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full border transition-colors ${isStatic ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary text-muted-foreground border-transparent'}`}
                                        title={isStatic ? "Showing raw content (Static)" : "Showing tracking URL (Dynamic)"}
                                    >
                                        {isStatic ? <Wifi size={14} /> : <Globe size={14} />}
                                        {isStatic ? 'Static' : 'Dynamic'}
                                    </button>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 w-full flex items-center justify-center">
                                    <QRCodeSVG
                                        id="qr-code-svg"
                                        value={qrValue}
                                        size={200}
                                        level="H"
                                        includeMargin
                                    />
                                </div>

                                <div className="w-full bg-secondary/50 p-3 rounded-lg mb-4 text-left">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Encoded Data:</p>
                                    <p className="text-xs font-mono break-all text-foreground">{qrValue}</p>
                                </div>

                                <button
                                    onClick={downloadQR}
                                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    <Download size={18} />
                                    Download PNG
                                </button>

                                {isStatic && (
                                    <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs text-left">
                                        <strong>Note:</strong> Static QR codes work offline and directly on the device (e.g. WiFi connect), but they cannot be edited later and scans are not tracked.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
