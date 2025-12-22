"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Link as LinkIcon, User, Wifi, FileText, Zap, Loader2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type QRType = 'url' | 'biopage' | 'vcard' | 'wifi' | 'text'

export default function CreateQRPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [type, setType] = useState<QRType>('url')
    const [name, setName] = useState('')
    const [content, setContent] = useState<any>({})
    const [loading, setLoading] = useState(false)

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        router.push('/login')
        return null
    }

    const handleCreate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/qr/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, content })
            })

            const data = await res.json()

            if (data.success) {
                router.push('/dashboard')
            } else {
                alert('Failed to create QR code: ' + data.error)
            }
        } catch (error) {
            console.error('Error creating QR:', error)
            alert('Failed to create QR code')
        } finally {
            setLoading(false)
        }
    }

    const qrTypes = [
        { id: 'url', icon: LinkIcon, label: 'URL Redirect', desc: 'Redirect to any website' },
        { id: 'biopage', icon: Zap, label: 'Bio Page', desc: 'Linktree-style landing page' },
        { id: 'vcard', icon: User, label: 'Contact Card', desc: 'Share contact information' },
        { id: 'wifi', icon: Wifi, label: 'Wi-Fi', desc: 'Connect to Wi-Fi network' },
        { id: 'text', icon: FileText, label: 'Plain Text', desc: 'Display text message' },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="h-16 border-b bg-card flex items-center px-6 gap-4 sticky top-0 z-50">
                <Link href="/dashboard" className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">Create Dynamic QR Code</h1>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}>
                            1
                        </div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}>
                            2
                        </div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-primary' : 'bg-secondary'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            }`}>
                            3
                        </div>
                    </div>
                </div>

                {/* Step 1: Choose Type */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Choose QR Code Type</h2>
                            <p className="text-muted-foreground">Select what your QR code will do</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {qrTypes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id as QRType)}
                                    className={`p-6 rounded-2xl border-2 transition-all text-left ${type === t.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === t.id ? 'bg-primary/20' : 'bg-secondary'
                                            }`}>
                                            <t.icon className={type === t.id ? 'text-primary' : 'text-muted-foreground'} size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-1">{t.label}</h3>
                                            <p className="text-sm text-muted-foreground">{t.desc}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Enter Content */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Enter Details</h2>
                            <p className="text-muted-foreground">Fill in the information for your QR code</p>
                        </div>

                        <div className="bg-card border rounded-2xl p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">QR Code Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., My Website Link"
                                    className="w-full p-3 rounded-lg border bg-background"
                                />
                            </div>

                            {type === 'url' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Destination URL</label>
                                    <input
                                        type="url"
                                        value={content.url || ''}
                                        onChange={(e) => setContent({ url: e.target.value })}
                                        placeholder="https://example.com"
                                        className="w-full p-3 rounded-lg border bg-background"
                                    />
                                </div>
                            )}

                            {type === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Text Content</label>
                                    <textarea
                                        value={content.text || ''}
                                        onChange={(e) => setContent({ text: e.target.value })}
                                        placeholder="Enter your text here..."
                                        className="w-full p-3 rounded-lg border bg-background min-h-[120px] resize-none"
                                    />
                                </div>
                            )}

                            {type === 'wifi' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Network Name (SSID)</label>
                                        <input
                                            type="text"
                                            value={content.ssid || ''}
                                            onChange={(e) => setContent({ ...content, ssid: e.target.value })}
                                            placeholder="MyWiFi"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password</label>
                                        <input
                                            type="text"
                                            value={content.password || ''}
                                            onChange={(e) => setContent({ ...content, password: e.target.value })}
                                            placeholder="password123"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Encryption</label>
                                        <select
                                            value={content.encryption || 'WPA'}
                                            onChange={(e) => setContent({ ...content, encryption: e.target.value })}
                                            className="w-full p-3 rounded-lg border bg-background"
                                        >
                                            <option value="WPA">WPA/WPA2</option>
                                            <option value="WEP">WEP</option>
                                            <option value="nopass">No Password</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {type === 'biopage' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Page Title</label>
                                        <input
                                            type="text"
                                            value={content.title || ''}
                                            onChange={(e) => setContent({ ...content, title: e.target.value })}
                                            placeholder="John Doe's Links"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description / Bio</label>
                                        <textarea
                                            value={content.description || ''}
                                            onChange={(e) => setContent({ ...content, description: e.target.value })}
                                            placeholder="Welcome to my digital space..."
                                            className="w-full p-3 rounded-lg border bg-background min-h-[80px]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Links</label>
                                        <div className="space-y-3">
                                            {(content.links || []).map((link: any, index: number) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            onChange={(e) => {
                                                                const newLinks = [...(content.links || [])]
                                                                newLinks[index].label = e.target.value
                                                                setContent({ ...content, links: newLinks })
                                                            }}
                                                            placeholder="Link Label (e.g. Website)"
                                                            className="w-full p-2 rounded-md border bg-background text-sm"
                                                        />
                                                        <input
                                                            type="url"
                                                            value={link.url}
                                                            onChange={(e) => {
                                                                const newLinks = [...(content.links || [])]
                                                                newLinks[index].url = e.target.value
                                                                setContent({ ...content, links: newLinks })
                                                            }}
                                                            placeholder="https://..."
                                                            className="w-full p-2 rounded-md border bg-background text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newLinks = content.links.filter((_: any, i: number) => i !== index)
                                                            setContent({ ...content, links: newLinks })
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setContent({ ...content, links: [...(content.links || []), { label: '', url: '' }] })}
                                                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                                            >
                                                + Add Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'vcard' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={content.firstName || ''}
                                                onChange={(e) => setContent({ ...content, firstName: e.target.value })}
                                                placeholder="John"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={content.lastName || ''}
                                                onChange={(e) => setContent({ ...content, lastName: e.target.value })}
                                                placeholder="Doe"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Mobile Phone</label>
                                            <input
                                                type="tel"
                                                value={content.phone || ''}
                                                onChange={(e) => setContent({ ...content, phone: e.target.value })}
                                                placeholder="+1 234 567 890"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={content.email || ''}
                                                onChange={(e) => setContent({ ...content, email: e.target.value })}
                                                placeholder="john@example.com"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Company</label>
                                        <input
                                            type="text"
                                            value={content.company || ''}
                                            onChange={(e) => setContent({ ...content, company: e.target.value })}
                                            placeholder="Acme Inc."
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Job Title</label>
                                        <input
                                            type="text"
                                            value={content.jobTitle || ''}
                                            onChange={(e) => setContent({ ...content, jobTitle: e.target.value })}
                                            placeholder="Manager"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Website</label>
                                        <input
                                            type="url"
                                            value={content.website || ''}
                                            onChange={(e) => setContent({ ...content, website: e.target.value })}
                                            placeholder="https://example.com"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address</label>
                                        <textarea
                                            value={content.address || ''}
                                            onChange={(e) => setContent({ ...content, address: e.target.value })}
                                            placeholder="123 Main St, City, Country"
                                            className="w-full p-3 rounded-lg border bg-background min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!name || (type === 'url' && !content.url) || (type === 'text' && !content.text)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Create */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
                            <p className="text-muted-foreground">Confirm your QR code details</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-card border rounded-2xl p-6 space-y-4">
                                <h3 className="font-semibold text-lg">Details</h3>
                                <div>
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium">{name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-medium capitalize">{type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Content</p>
                                    <p className="font-medium text-sm break-all">
                                        {type === 'url' && content.url}
                                        {type === 'text' && content.text}
                                        {type === 'wifi' && `${content.ssid} (${content.encryption})`}
                                        {type === 'biopage' && 'Bio page will be created'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card border rounded-2xl p-6 flex flex-col items-center justify-center">
                                <p className="text-sm text-muted-foreground mb-4">QR Code Preview</p>
                                <div className="bg-white p-4 rounded-xl">
                                    <QRCodeSVG
                                        value={`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/qr/preview`}
                                        size={200}
                                        level="H"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Actual QR will be generated after creation
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setStep(2)}
                                className="px-6 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create QR Code'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
