import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Upload, Copy, Check, RefreshCw, X } from 'lucide-react'

export function QRScanner() {
    const [scanResult, setScanResult] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [cameras, setCameras] = useState<Array<{ id: string, label: string }>>([])
    const [selectedCamera, setSelectedCamera] = useState<string>('')

    const scannerRef = useRef<Html5Qrcode | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Cleanup on unmount
    useEffect(() => {
        // Fetch cameras
        Html5Qrcode.getCameras().then(devices => {
            if (devices && devices.length) {
                setCameras(devices.map(d => ({ id: d.id, label: d.label })))
                setSelectedCamera(devices[0].id)
            }
        }).catch(err => {
            console.error("Error getting cameras", err)
        })

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error)
            }
        }
    }, [])

    const startCamera = async () => {
        setError(null)
        setScanResult(null)

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode("reader")
            }

            const cameraId = selectedCamera || (cameras.length > 0 ? cameras[0].id : undefined)
            const config = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" }

            await scannerRef.current.start(
                config,
                {
                    fps: 10,
                    qrbox: { width: 400, height: 400 }
                },
                (decodedText) => {
                    setScanResult(decodedText)
                    stopCamera()
                },
                (errorMessage) => {
                    // ignore frame errors
                }
            )
            setIsScanning(true)
        } catch (err) {
            setError("Could not access camera. Please ensure permissions are granted.")
            console.error(err)
        }
    }

    const stopCamera = async () => {
        if (scannerRef.current && isScanning) {
            try {
                await scannerRef.current.stop()
                setIsScanning(false)
            } catch (err) {
                console.error("Failed to stop scanner", err)
            }
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("reader")
        }

        scannerRef.current.scanFile(file, true)
            .then(decodedText => {
                setScanResult(decodedText)
                setError(null)
            })
            .catch(err => {
                setError("Could not find a QR code in this image.")
                setScanResult(null)
            })
    }

    const copyToClipboard = () => {
        if (scanResult) {
            navigator.clipboard.writeText(scanResult)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Scanner Area */}
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video flex flex-col items-center justify-center">
                <div id="reader" className="w-full h-full absolute inset-0"></div>

                {!isScanning && !scanResult && (
                    <div className="relative z-10 text-center space-y-6 p-6">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                            <Camera className="text-white opacity-80" size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-white font-bold text-xl">Scan QR Code</h3>
                            <p className="text-white/60 text-sm max-w-xs mx-auto">
                                Use your camera or upload an image to scan
                            </p>
                        </div>

                        {/* Camera Select */}
                        {cameras.length > 0 && (
                            <div className="max-w-xs mx-auto">
                                <select
                                    value={selectedCamera}
                                    onChange={(e) => setSelectedCamera(e.target.value)}
                                    className="w-full bg-black/50 text-white text-sm border border-white/20 rounded-lg p-2 outline-none focus:border-primary"
                                >
                                    {cameras.map(cam => (
                                        <option key={cam.id} value={cam.id}>
                                            {cam.label || `Camera ${cam.id.slice(0, 5)}...`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={startCamera}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
                            >
                                <Camera size={18} />
                                Start Camera
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-2.5 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all backdrop-blur-sm flex items-center gap-2"
                            >
                                <Upload size={18} />
                                Upload Image
                            </button>
                        </div>
                    </div>
                )}

                {isScanning && (
                    <button
                        onClick={stopCamera}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center text-sm font-medium">
                    {error}
                </div>
            )}

            {/* Result Area */}
            {scanResult && (
                <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-green-600">
                            <Check size={20} />
                            Scan Successful
                        </h3>
                        <button
                            onClick={() => {
                                setScanResult(null)
                                setError(null)
                            }}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                            <RefreshCw size={12} />
                            Scan Another
                        </button>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl break-all font-mono text-sm border">
                        {scanResult}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors"
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
