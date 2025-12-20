import React, { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Share2, Type, Palette, Link as LinkIcon, Mail, Wifi, Contact } from 'lucide-react'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { Slider } from '@/components/ui/Slider'

type QRType = 'text' | 'url' | 'email' | 'wifi' | 'vcard'

export function QRGenerator() {
    const [type, setType] = useState<QRType>('text')
    const [qrValue, setQrValue] = useState('')

    // Type specific states
    const [textContent, setTextContent] = useState('Hello World')
    const [urlContent, setUrlContent] = useState('https://example.com')

    const [email, setEmail] = useState({ to: 'example@email.com', subject: 'Hello', body: 'Your message here' })
    const [wifi, setWifi] = useState({ ssid: '', password: '', encryption: 'WPA' as 'WPA' | 'WEP' | 'nopass', hidden: false })
    const [vcard, setVcard] = useState({ firstName: '', lastName: '', phone: '', email: '', org: '', title: '' })

    const [fgColor, setFgColor] = useState('#000000')
    const [bgColor, setBgColor] = useState('#ffffff')
    const [size, setSize] = useState(300)

    const qrRef = useRef<SVGSVGElement>(null)

    // Update QR Value based on type and inputs
    useEffect(() => {
        let val = ''
        switch (type) {
            case 'text':
                val = textContent
                break
            case 'url':
                val = urlContent
                break
            case 'email':
                // Use MATMSG format for better mobile compatibility
                val = `MATMSG:TO:${email.to};SUB:${email.subject};BODY:${email.body};;`
                break
            case 'wifi':
                // WIFI:S:MyNetwork;T:WPA;P:password;;
                val = `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};H:${wifi.hidden};;`
                break
            case 'vcard':
                val = `BEGIN:VCARD
VERSION:3.0
N:${vcard.lastName};${vcard.firstName}
FN:${vcard.firstName} ${vcard.lastName}
ORG:${vcard.org}
TITLE:${vcard.title}
TEL:${vcard.phone}
EMAIL:${vcard.email}
END:VCARD`
                break
        }
        setQrValue(val)
    }, [type, textContent, urlContent, email, wifi, vcard])

    const handleDownload = (format: 'png' | 'svg') => {
        if (!qrRef.current) return

        if (format === 'svg') {
            const svgData = new XMLSerializer().serializeToString(qrRef.current)
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `qrcode-${type}.svg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            const svgData = new XMLSerializer().serializeToString(qrRef.current)
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            canvas.width = size
            canvas.height = size

            img.onload = () => {
                if (ctx) {
                    ctx.fillStyle = bgColor
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    ctx.drawImage(img, 0, 0)
                    const pngFile = canvas.toDataURL('image/png')
                    const link = document.createElement('a')
                    link.download = `qrcode-${type}.png`
                    link.href = pngFile
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                }
            }

            img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
        }
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8 h-full">
            {/* Controls */}
            <div className="lg:col-span-1 space-y-6 bg-card p-6 rounded-2xl border shadow-sm h-fit">

                {/* Type Selector */}
                <div className="grid grid-cols-5 gap-2">
                    {[
                        { id: 'text', icon: Type, label: 'Text' },
                        { id: 'url', icon: LinkIcon, label: 'URL' },
                        { id: 'wifi', icon: Wifi, label: 'Wi-Fi' },
                        { id: 'email', icon: Mail, label: 'Email' },
                        { id: 'vcard', icon: Contact, label: 'Contact' },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setType(t.id as QRType)}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${type === t.id
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                                }`}
                        >
                            <t.icon size={18} />
                            <span className="text-[9px] font-medium">{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                        <Type size={18} />
                        <h3>Content</h3>
                    </div>

                    {/* Dynamic Inputs */}
                    {type === 'text' && (
                        <textarea
                            value={textContent}
                            onChange={(e) => setTextContent(e.target.value)}
                            className="w-full min-h-[100px] p-3 rounded-lg border bg-background resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Enter text..."
                        />
                    )}

                    {type === 'url' && (
                        <input
                            type="url"
                            value={urlContent}
                            onChange={(e) => setUrlContent(e.target.value)}
                            className="w-full p-3 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="https://example.com"
                        />
                    )}

                    {type === 'wifi' && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={wifi.ssid}
                                onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Network Name (SSID)"
                            />
                            <input
                                type="text"
                                value={wifi.password}
                                onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Password"
                            />
                            <select
                                value={wifi.encryption}
                                onChange={(e) => setWifi({ ...wifi, encryption: e.target.value as any })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                            >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">No Password</option>
                            </select>
                        </div>
                    )}

                    {type === 'email' && (
                        <div className="space-y-3">
                            <input
                                type="email"
                                value={email.to}
                                onChange={(e) => setEmail({ ...email, to: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Recipient Email"
                            />
                            <input
                                type="text"
                                value={email.subject}
                                onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Subject"
                            />
                            <textarea
                                value={email.body}
                                onChange={(e) => setEmail({ ...email, body: e.target.value })}
                                className="w-full min-h-[80px] p-3 rounded-lg border bg-background text-sm resize-none"
                                placeholder="Message Body"
                            />
                        </div>
                    )}

                    {type === 'vcard' && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={vcard.firstName}
                                    onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                                    className="w-full p-3 rounded-lg border bg-background text-sm"
                                    placeholder="First Name"
                                />
                                <input
                                    type="text"
                                    value={vcard.lastName}
                                    onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                                    className="w-full p-3 rounded-lg border bg-background text-sm"
                                    placeholder="Last Name"
                                />
                            </div>
                            <input
                                type="tel"
                                value={vcard.phone}
                                onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Phone Number"
                            />
                            <input
                                type="email"
                                value={vcard.email}
                                onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Email"
                            />
                            <input
                                type="text"
                                value={vcard.org}
                                onChange={(e) => setVcard({ ...vcard, org: e.target.value })}
                                className="w-full p-3 rounded-lg border bg-background text-sm"
                                placeholder="Organization"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
                        <Palette size={18} />
                        <h3>Appearance</h3>
                    </div>

                    <ColorPicker
                        label="Foreground"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                    />
                    <ColorPicker
                        label="Background"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center bg-secondary/20 rounded-2xl border border-dashed p-8 gap-8">
                <div className="bg-white p-4 rounded-xl shadow-xl">
                    <QRCodeSVG
                        ref={qrRef}
                        value={qrValue}
                        size={size}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => handleDownload('png')}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Download size={18} />
                        Download PNG
                    </button>
                    <button
                        onClick={() => handleDownload('svg')}
                        className="flex items-center gap-2 px-6 py-3 bg-card border hover:bg-secondary/50 rounded-full font-medium transition-all"
                    >
                        <Share2 size={18} />
                        Download SVG
                    </button>
                </div>
            </div>
        </div>
    )
}
