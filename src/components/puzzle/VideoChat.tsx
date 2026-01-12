"use client"

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Maximize2, Minimize2, MoveHorizontal } from 'lucide-react'

interface VideoChatProps {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isMuted: boolean
    isVideoOff: boolean
    onToggleMute: () => void
    onToggleVideo: () => void
}

export default function VideoChat({
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    onToggleMute,
    onToggleVideo
}: VideoChatProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const [isRemoteMuted, setIsRemoteMuted] = useState(false)
    const [isFullScreen, setIsFullScreen] = useState(false)

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // Only render if there's at least one stream (local or remote)
    // If we are waiting for connection, we might show a loader, but the "LOCKED" state is handled by the parent not rendering this component.

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-6 ${isFullScreen ? 'fixed inset-0 z-50 h-screen w-screen m-0 rounded-none' : 'w-full aspect-video'}`}
        >
            {/* Header Overlay */}
            <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start transition-opacity duration-300 ${isFullScreen ? 'opacity-0 hover:opacity-100' : ''}`}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Live Feed</span>
                </div>

                <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
                >
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Remote Video (Main) */}
            <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        muted={isRemoteMuted} // Mute remote audio locally
                    />
                ) : (
                    <div className="text-white/20 flex flex-col items-center gap-2 animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <VideoOff size={32} />
                        </div>
                        <span className="text-xs font-bold tracking-widest uppercase">Connecting Partner...</span>
                    </div>
                )}
            </div>

            {/* Local Video (PIP) */}
            <motion.div
                drag
                dragConstraints={{ left: 0, right: 200, top: 0, bottom: 200 }}
                className={`absolute ${isFullScreen ? 'bottom-8 right-8 w-48 aspect-video' : 'bottom-4 right-4 w-32 aspect-video'} bg-zinc-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl z-20`}
            >
                {localStream && !isVideoOff ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white/30">
                        <VideoOff size={20} />
                    </div>
                )}
            </motion.div>

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex justify-center gap-4 transition-opacity duration-300 ${isFullScreen ? 'opacity-0 hover:opacity-100' : ''}`}>
                <button
                    onClick={() => setIsRemoteMuted(!isRemoteMuted)}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${isRemoteMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isRemoteMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <button
                    onClick={onToggleMute}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                    onClick={onToggleVideo}
                    className={`p-3 rounded-full backdrop-blur-md transition-all ${isVideoOff ? 'bg-red-500/80 text-white hover:bg-red-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
                {!isFullScreen && (
                    <button
                        onClick={() => setIsFullScreen(true)}
                        className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden"
                    >
                        <Maximize2 size={20} />
                    </button>
                )}
            </div>
        </motion.div>
    )
}
