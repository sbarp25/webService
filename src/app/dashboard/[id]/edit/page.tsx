"use client"

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

interface QRCodeDetails {
    id: string
    shortCode: string
    name: string
    type: string
    content: string
    isActive: boolean
}

export default function EditQRPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Form state
    const [name, setName] = useState('')
    const [content, setContent] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [type, setType] = useState('url')

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
                const qr = data.qrCode
                setName(qr.name)
                setContent(qr.content)
                setIsActive(qr.isActive)
                setType(qr.type)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!params?.id) return

        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/qr/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    content,
                    isActive,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/dashboard/${params.id}`)
                router.refresh()
            } else {
                setError(data.error || 'Failed to update QR code')
            }
        } catch (error) {
            console.error('Error updating QR code:', error)
            setError('An error occurred while updating')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    if (error && !name) {
        return (
            <div className="min-h-screen container mx-auto p-4 flex flex-col items-center justify-center">
                <p className="text-red-500 mb-4">{error}</p>
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
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <header className="border-b bg-card sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold">Edit QR Code</h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-card border rounded-2xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="My QR Code"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    A friendly name to help you identify this QR code
                                </p>
                            </div>

                            {type === 'url' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Destination URL</label>
                                    <input
                                        type="url"
                                        value={typeof content === 'string' ? content : (content as any).url || ''}
                                        onChange={(e) => setContent({ ...(content as any), url: e.target.value })}
                                        placeholder="https://example.com"
                                        className="w-full p-3 rounded-lg border bg-background"
                                    />
                                </div>
                            )}

                            {type === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Text Content</label>
                                    <textarea
                                        value={typeof content === 'string' ? content : (content as any).text || ''}
                                        onChange={(e) => setContent({ ...(content as any), text: e.target.value })}
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
                                            value={(content as any).ssid || ''}
                                            onChange={(e) => setContent({ ...(content as any), ssid: e.target.value })}
                                            placeholder="MyWiFi"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Password</label>
                                        <input
                                            type="text"
                                            value={(content as any).password || ''}
                                            onChange={(e) => setContent({ ...(content as any), password: e.target.value })}
                                            placeholder="password123"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Encryption</label>
                                        <select
                                            value={(content as any).encryption || 'WPA'}
                                            onChange={(e) => setContent({ ...(content as any), encryption: e.target.value })}
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
                                            value={(content as any).title || ''}
                                            onChange={(e) => setContent({ ...(content as any), title: e.target.value })}
                                            placeholder="John Doe's Links"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Description / Bio</label>
                                        <textarea
                                            value={(content as any).description || ''}
                                            onChange={(e) => setContent({ ...(content as any), description: e.target.value })}
                                            placeholder="Welcome to my digital space..."
                                            className="w-full p-3 rounded-lg border bg-background min-h-[80px]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Links</label>
                                        <div className="space-y-3">
                                            {((content as any).links || []).map((link: any, index: number) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={link.label}
                                                            onChange={(e) => {
                                                                const newLinks = [...((content as any).links || [])]
                                                                newLinks[index].label = e.target.value
                                                                setContent({ ...(content as any), links: newLinks })
                                                            }}
                                                            placeholder="Link Label"
                                                            className="w-full p-2 rounded-md border bg-background text-sm"
                                                        />
                                                        <input
                                                            type="url"
                                                            value={link.url}
                                                            onChange={(e) => {
                                                                const newLinks = [...((content as any).links || [])]
                                                                newLinks[index].url = e.target.value
                                                                setContent({ ...(content as any), links: newLinks })
                                                            }}
                                                            placeholder="https://..."
                                                            className="w-full p-2 rounded-md border bg-background text-sm"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newLinks = (content as any).links.filter((_: any, i: number) => i !== index)
                                                            setContent({ ...(content as any), links: newLinks })
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setContent({ ...(content as any), links: [...((content as any).links || []), { label: '', url: '' }] })}
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
                                                value={(content as any).firstName || ''}
                                                onChange={(e) => setContent({ ...(content as any), firstName: e.target.value })}
                                                placeholder="John"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={(content as any).lastName || ''}
                                                onChange={(e) => setContent({ ...(content as any), lastName: e.target.value })}
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
                                                value={(content as any).phone || ''}
                                                onChange={(e) => setContent({ ...(content as any), phone: e.target.value })}
                                                placeholder="+1..."
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={(content as any).email || ''}
                                                onChange={(e) => setContent({ ...(content as any), email: e.target.value })}
                                                placeholder="john@example.com"
                                                className="w-full p-3 rounded-lg border bg-background"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Company</label>
                                        <input
                                            type="text"
                                            value={(content as any).company || ''}
                                            onChange={(e) => setContent({ ...(content as any), company: e.target.value })}
                                            placeholder="Acme Inc."
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Job Title</label>
                                        <input
                                            type="text"
                                            value={(content as any).jobTitle || ''}
                                            onChange={(e) => setContent({ ...(content as any), jobTitle: e.target.value })}
                                            placeholder="Manager"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Website</label>
                                        <input
                                            type="url"
                                            value={(content as any).website || ''}
                                            onChange={(e) => setContent({ ...(content as any), website: e.target.value })}
                                            placeholder="https://example.com"
                                            className="w-full p-3 rounded-lg border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Address</label>
                                        <textarea
                                            value={(content as any).address || ''}
                                            onChange={(e) => setContent({ ...(content as any), address: e.target.value })}
                                            placeholder="123 Main St, City, Country"
                                            className="w-full p-3 rounded-lg border bg-background min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="bg-secondary/30 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium">Active Status</h3>
                                    <p className="text-sm text-muted-foreground">
                                        When inactive, the QR code effectively stops working
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
