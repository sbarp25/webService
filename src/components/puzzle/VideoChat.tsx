"use client"

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'

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
    const [isExpanded, setIsExpanded] = useState(false)

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
            className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-6 ${isExpanded ? 'fixed inset-4 z-50 h-[80vh] w-[90vw] mx-auto' : 'w-full aspect-video'}`}
        >
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
                className={`absolute ${isExpanded ? 'top-8 right-8 w-64' : 'top-4 right-4 w-32'} aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-800 z-10`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                {localStream ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted // Always mute local video to prevent feedback
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'} transform -scale-x-100`}
                    />
                ) : null}
                {(!localStream || isVideoOff) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-white/30">
                        <VideoOff size={20} />
                    </div>
                )}
            </motion.div>

            {/* Controls Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsRemoteMuted(!isRemoteMuted)}
                        className={`p-2 rounded-xl transition-all ${isRemoteMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isRemoteMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleMute}
                        className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        onClick={onToggleVideo}
                        className={`p-3 rounded-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 md:hidden"
                    >
                        {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
