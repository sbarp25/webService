"use client";
import React, { useState, useRef, useEffect } from 'react';
import AntScene from '@/components/ui/AntScene';
import { Upload, Download, Type, Image as ImageIcon, Video, RefreshCw, Layers } from 'lucide-react';
import * as PIXI from 'pixi.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function ParticleToolPage() {
    const [text, setText] = useState("PARTICLE");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [color, setColor] = useState("#ffffff");
    const [bgColor, setBgColor] = useState("#000000");
    const [step, setStep] = useState(6);
    const [isRecording, setIsRecording] = useState(false);
    const [recordProgress, setRecordProgress] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const pixiAppRef = useRef<PIXI.Application | null>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setText("");
        }
    };

    const startRecording = async () => {
        if (!pixiAppRef.current) return;

        setIsRecording(true);
        setRecordProgress(0);

        const canvas = pixiAppRef.current.canvas as HTMLCanvasElement;

        // Check for captureStream support
        if (!(canvas as any).captureStream) {
            alert("Your browser does not support canvas recording.");
            setIsRecording(false);
            return;
        }

        const stream = (canvas as any).captureStream(60); // 60fps

        // Find supported types
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 50000000 // 50 Mbps - Extreme Quality
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `particle-hq-${imageUrl ? 'image' : 'text'}.webm`;
            a.click();
            setIsRecording(false);
            setRecordProgress(0);
        };

        recorder.start();

        // Record for 4.5 seconds (one full cycle: form -> hold -> scatter)
        const duration = 4500;
        const interval = 50;
        let elapsed = 0;

        const progressTimer = setInterval(() => {
            elapsed += interval;
            const progress = (elapsed / duration) * 100;
            setRecordProgress(Math.min(100, progress));

            if (elapsed >= duration) {
                clearInterval(progressTimer);
                recorder.stop();
            }
        }, interval);
    };

    if (!isClient) return null;

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Sidebar Controls */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full md:w-80 bg-[#111] border-r border-white/5 p-6 flex flex-col gap-8 z-10 overflow-y-auto"
            >
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/20">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        Particle Studio
                    </h1>
                    <p className="text-white/40 text-[13px] leading-relaxed">Create and export high-bitrate particle loops.</p>
                </div>

                <div className="space-y-6">
                    {/* Source Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            Source Type
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-black/20 rounded-xl">
                            <button
                                onClick={() => { setImageUrl(null); setText("PARTICLE"); }}
                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${!imageUrl ? 'bg-white/10 shadow-lg text-white' : 'text-white/40 hover:text-white/60'}`}
                            >
                                <Type className="w-4 h-4" /> Text
                            </button>
                            <label className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${imageUrl ? 'bg-white/10 shadow-lg text-white' : 'text-white/40 hover:text-white/60'}`}>
                                <ImageIcon className="w-4 h-4" /> Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Dynamic Inputs */}
                    <AnimatePresence mode="wait">
                        {!imageUrl ? (
                            <motion.div
                                key="text-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Text Content</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500/50 resize-none h-28 transition-colors"
                                    placeholder="Type cinematic text..."
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="image-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-3"
                            >
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Image Preview</label>
                                <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <label className="p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors">
                                            <RefreshCw className="w-5 h-5 text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Appearance */}
                    <div className="space-y-6 pt-6 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Density</label>
                                <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">STEP {step}</span>
                            </div>
                            <input
                                type="range" min="3" max="15" step="1"
                                value={step} onChange={(e) => setStep(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-purple-500 border border-white/5"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Particle</label>
                                <div className="relative w-full h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center hover:border-white/20 transition-colors">
                                    <input
                                        type="color" value={color} onChange={(e) => setColor(e.target.value)}
                                        className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer"
                                    />
                                    <span className="relative z-10 text-[10px] font-mono opacity-60 pointer-events-none uppercase">{color}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Background</label>
                                <div className="relative w-full h-12 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center hover:border-white/20 transition-colors">
                                    <input
                                        type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                                        className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer"
                                    />
                                    <span className="relative z-10 text-[10px] font-mono opacity-60 pointer-events-none uppercase">{bgColor}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <button
                        disabled={isRecording}
                        onClick={startRecording}
                        className={`w-full py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group ${isRecording ? 'bg-white/5 text-white/20' : 'bg-gradient-to-br from-purple-600 to-blue-700 hover:from-purple-500 hover:to-blue-600 shadow-xl shadow-purple-500/10 active:scale-[0.98]'}`}
                    >
                        {isRecording ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Rendering HD Video</span>
                                </div>
                                <span className="text-[10px] font-mono opacity-50">{Math.round(recordProgress)}% Complete</span>
                                <div
                                    className="absolute bottom-0 left-0 h-1 bg-white/20 transition-all duration-300"
                                    style={{ width: `${recordProgress}%` }}
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                                    <span>Export Ultra HQ</span>
                                </div>
                                <span className="text-[10px] font-medium opacity-50 uppercase tracking-[0.2em]">HD • 50 Mbps • WebM</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Preview Area */}
            <div className="flex-1 relative bg-black flex items-center justify-center p-6 md:p-12 lg:p-20">
                <motion.div
                    layout
                    className="w-full h-full relative border border-white/10 rounded-3xl overflow-hidden bg-[radial-gradient(circle_at_center,_#161616_0%,_#050505_100%)] shadow-2xl"
                    style={{ backgroundColor: bgColor }}
                >
                    <AntScene
                        text={text}
                        imageUrl={imageUrl || undefined}
                        particleColor={parseInt(color.replace('#', '0x'))}
                        bgColor={parseInt(bgColor.replace('#', '0x'))}
                        step={step}
                        onAppInit={(app) => { pixiAppRef.current = app; }}
                    />

                    {/* Effects Layers */}
                    <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

                    {/* Status UI */}
                    <div className="absolute top-8 left-8 flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-[11px] font-bold tracking-[0.15em] text-white/50 uppercase">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-[pulse_2s_infinite]" />
                            Live Renderer
                        </div>
                        {isRecording && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="px-4 py-2 bg-red-500/10 backdrop-blur-xl rounded-full border border-red-500/20 text-[11px] font-bold tracking-[0.15em] text-red-500 uppercase flex items-center gap-2"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Recording
                            </motion.div>
                        )}
                    </div>

                    <div className="absolute bottom-8 right-8 text-white/10 text-[10px] font-mono tracking-widest uppercase pointer-events-none">
                        Engine // Ant_Particle_v2.0
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
