"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Users, Trophy, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import PuzzleBoard, { Piece } from '@/components/puzzle/PuzzleBoard'
import InstantChat from '@/components/puzzle/InstantChat'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import Peer, { DataConnection } from 'peerjs'

type GameState = 'LOBBY' | 'MATCHING' | 'PLAYING' | 'COMPLETED'

const GRID_SIZE = { cols: 4, rows: 3 }
const PIECE_WIDTH = 100
const PIECE_HEIGHT = 100

import VideoChat from '@/components/puzzle/VideoChat'

export default function PuzzlePage() {
    const [gameState, setGameState] = useState<GameState>('LOBBY')
    const [isComplete, setIsComplete] = useState(false)
    const [roomId, setRoomId] = useState<string>('')
    const [localPlayerId] = useState(() => "user-" + Math.random().toString(36).substr(2, 5))
    // PeerJS State
    const [peerId, setPeerId] = useState<string>('')
    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<DataConnection | null>(null)

    // Video Chat State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(false)

    // Game State
    const [onlineCount, setOnlineCount] = useState(1243) // Mock count since we lost Pusher presence
    const [messages, setMessages] = useState<any[]>([])
    const [pieces, setPieces] = useState<Piece[]>([])
    const [currentImage, setCurrentImage] = useState("https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80")
    const [chatUnlocked, setChatUnlocked] = useState(false)

    // User Profile for Matchmaking
    const [userName, setUserName] = useState('')
    const [userGender, setUserGender] = useState('Male')
    const [matchPreference, setMatchPreference] = useState('Any')
    const [partnerName, setPartnerName] = useState('Partner')
    const [debugInfo, setDebugInfo] = useState<string>('')
    const [connectionStatus, setConnectionStatus] = useState<string>('IDLE')

    // Refs for State accessed in Event Listeners
    const userNameRef = useRef(userName)
    const localPlayerIdRef = useRef(localPlayerId)

    useEffect(() => {
        userNameRef.current = userName
        localPlayerIdRef.current = localPlayerId
    }, [userName, localPlayerId])

    // 1. Initialize PeerJS on Mount
    useEffect(() => {
        const peer = new Peer()

        peer.on('open', (id) => {
            console.log('--- PeerJS: Connected with ID:', id)
            setPeerId(id)
            setDebugInfo('Peer system ready.')
        })

        peer.on('error', (err) => {
            console.error('--- PeerJS Error:', err)
            setDebugInfo(`Peer Error: ${err.type}`)
        })

        // Data Connection (Chat/Game)
        peer.on('connection', (conn) => {
            console.log('--- PeerJS: Incoming connection from', conn.peer)
            setDebugInfo('Incoming connection...')
            handleConnection(conn)
        })

        // Media Connection (Video)
        peer.on('call', async (call) => {
            console.log('--- PeerJS: Incoming Call ---')
            // Answer the call with our local stream (if ready)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                setLocalStream(stream)
                call.answer(stream) // Answer the call with an A/V stream.

                call.on('stream', (remoteStream) => {
                    console.log('--- PeerJS: Received Remote Stream ---')
                    setRemoteStream(remoteStream)
                })
            } catch (err) {
                console.error('Failed to get local stream to answer call', err)
            }
        })

        peer.on('error', (err) => {
            console.error('--- PeerJS Error:', err)
        })

        peerRef.current = peer

        return () => {
            // Cleanup streams
            if (localStream) localStream.getTracks().forEach(track => track.stop())
            peer.destroy()
        }
    }, [])

    // Video Chat Controls
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !isMuted)
            setIsMuted(!isMuted)
        }
    }

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !isVideoOff)
            setIsVideoOff(!isVideoOff)
        }
    }

    // 2. Handle Incoming/Outgoing Connection
    const handleConnection = (conn: DataConnection) => {
        connRef.current = conn
        setConnectionStatus('CONNECTING')

        conn.on('open', () => {
            console.log('--- PeerJS: Connection Open! ---')
            setDebugInfo('Connection established!')
            setConnectionStatus('CONNECTED')
        })

        conn.on('data', (data: any) => {
            console.log('--- PeerJS: Data Received ---', data)
            handleGameData(data)
        })

        conn.on('close', () => {
            console.log('--- PeerJS: Connection Closed ---')
            setDebugInfo('Connection closed.')
            alert('Partner disconnected!')
            setGameState('LOBBY')
            setPieces([])
            setMessages([])
        })

        conn.on('error', (err) => {
            console.error('--- PeerJS Connection Error:', err)
            setDebugInfo(`Connection Error: ${err}`)
            setConnectionStatus('ERROR')
        })
    }

    const handleGameData = (data: any) => {
        if (data.type === 'HANDSHAKE_INIT') {
            // Received by Passive Peer (Guest)
            console.log('--- Handshake INIT Received ---')
            setPieces(data.pieces)
            if (data.name) setPartnerName(data.name)
            setGameState('PLAYING')

            // Send ACK back
            if (connRef.current) {
                connRef.current.send({
                    type: 'HANDSHAKE_ACK',
                    name: userNameRef.current,
                    senderId: localPlayerIdRef.current
                })
            }
        } else if (data.type === 'HANDSHAKE_ACK') {
            // Received by Active Peer (Host)
            console.log('--- Handshake ACK Received ---')
            if (data.name) setPartnerName(data.name)
            setGameState('PLAYING')

        } else if (data.type === 'move') {
            setPieces(prev => prev.map(p =>
                p.id === data.pieceId
                    ? { ...p, position: data.position, container: data.container, lastMovedBy: data.senderId, isLocked: data.isLocked || p.isLocked }
                    : p
            ))
        } else if (data.type === 'chat') {
            setMessages(prev => [...prev, {
                id: Math.random().toString(36),
                text: data.text,
                sender: 'partner',
                timestamp: new Date(),
                senderId: data.senderId
            }])
        } else if (data.type === 'completed') {
            handleSolve(false)
        } else if (data.type === 'sync-board') {
            // Initial sync if needed, or if one player generates board
            if (data.pieces && pieces.length === 0) {
                setPieces(data.pieces)
            }
        } else if (data.type === 'NEW_GAME') {
            console.log('--- NEW GAME RECEIVED ---')
            setCurrentImage(data.image)
            setPieces(data.pieces)
            setIsComplete(false)
            setGameState('PLAYING')
        }
    }


    // 3. Initialize Pieces (Host Logic)
    // In P2P, we need to agree on pieces. 
    // Plan: The one who poll finds the match (Client A) -> Connects to Client B.
    // Client A generates board and sends to Client B.
    const generateBoard = () => {
        const initialPieces: Piece[] = []
        for (let row = 0; row < GRID_SIZE.rows; row++) {
            for (let col = 0; col < GRID_SIZE.cols; col++) {
                const id = row * GRID_SIZE.cols + col

                // Targets are 0-100% of the Board
                const targetX = (col / GRID_SIZE.cols) * 100
                const targetY = (row / GRID_SIZE.rows) * 100

                initialPieces.push({
                    id,
                    targetPos: { x: targetX, y: targetY },
                    // Init in Tray: Random 0-100% of Tray area
                    position: {
                        x: Math.random() * 80 + 10,
                        y: Math.random() * 80 + 10
                    },
                    container: 'tray',
                    isLocked: false
                })
            }
        }
        return initialPieces
    }


    // 4. Matchmaking Logic (MongoDB Poll)
    const startMatchmaking = async () => {
        if (!userName.trim()) {
            alert("Please enter your name first!")
            return
        }
        if (!peerId) {
            alert("PeerJS not initialized yet. Please wait...")
            return
        }

        setGameState('MATCHING')

        try {
            // A. Join Lobby
            await fetch('/api/matchmaking/join', {
                method: 'POST',
                body: JSON.stringify({
                    userId: localPlayerId,
                    name: userName,
                    gender: userGender,
                    preference: matchPreference,
                    peerId: peerId
                })
            })

            // B. Start Polling
            const pollInterval = setInterval(async () => {
                const res = await fetch('/api/matchmaking/poll', {
                    method: 'POST',
                    body: JSON.stringify({ userId: localPlayerId, gender: userGender, preference: matchPreference })
                })
                const data = await res.json()

                if (data.matchFound && data.partner) {
                    clearInterval(pollInterval)
                    console.log('--- Match Found! ---', data.partner)
                    setPartnerName(data.partner.name)

                    // Logic: If WE Found the match (active poller), we initiate connection
                    // Wait a random delay to avoid collision if both found same time (simple conflict res)
                    // Or relies on who found who. 
                    // To avoid double connection: The one whose ID is lexically smaller connects? 
                    // Or just whoever polls first. PeerJS handles double connections gracefully usually?

                    // Let's connect immediately.
                    connectToPartner(data.partner.peerId)
                }
            }, 2000)

            // Cleanup on unmount or cancel
            return () => clearInterval(pollInterval)

        } catch (e) {
            console.error('Matchmaking Failed', e)
            setGameState('LOBBY')
        }
    }

    const connectToPartner = (partnerPeerId: string) => {
        if (!peerRef.current) return
        console.log('--- Connecting to Partner ---', partnerPeerId)
        const conn = peerRef.current.connect(partnerPeerId)

        conn.on('open', () => {
            // We are the initiator (Host)
            console.log('--- Connection Opened (Host) -> Sending INIT ---')
            const newPieces = generateBoard()
            setPieces(newPieces)

            // Send Handshake INIT
            conn.send({
                type: 'HANDSHAKE_INIT',
                pieces: newPieces,
                name: userNameRef.current,
                senderId: localPlayerIdRef.current
            })

            // 2. Initiate Video Call - REMOVED (User wants manual trigger after solve)
            // startVideoCall(partnerPeerId)
        })

        handleConnection(conn)
    }

    const startVideoCall = async (partnerId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            setLocalStream(stream)

            if (peerRef.current) {
                const call = peerRef.current.call(partnerId, stream)
                call.on('stream', (remoteStream) => {
                    setRemoteStream(remoteStream)
                })
            }
        } catch (err) {
            console.error('Error starting video call:', err)
            alert('Could not start video chat. Please allow camera access.')
        }
    }


    // 5. Game Actions
    const broadcastMove = (pieceId: number, position: { x: number, y: number }, container: 'board' | 'tray', isLocked: boolean) => {
        if (connRef.current) {
            connRef.current.send({ type: 'move', pieceId, position, container, senderId: localPlayerId, isLocked })
        }
    }

    const broadcastComplete = () => {
        if (connRef.current) {
            connRef.current.send({ type: 'completed', senderId: localPlayerId })
        }
    }

    const sendMessage = (text: string) => {
        if (!text.trim()) return
        const newMessage = { id: Math.random().toString(36), text, sender: 'me', timestamp: new Date() }
        setMessages(prev => [...prev, newMessage])

        if (connRef.current) {
            connRef.current.send({ type: 'chat', text, senderId: localPlayerId })
        }
    }

    // 6. Completion Check
    useEffect(() => {
        if (pieces.length > 0 && pieces.every(p => p.isLocked) && !isComplete) {
            handleSolve(true)
        }
    }, [pieces, isComplete])

    // Resize Image Utility
    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const scale = MAX_WIDTH / img.width
                    canvas.width = MAX_WIDTH
                    canvas.height = img.height * scale
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
                    resolve(canvas.toDataURL('image/jpeg', 0.8))
                }
                img.src = e.target?.result as string
            }
            reader.readAsDataURL(file)
        })
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const resizedImage = await resizeImage(file)
        startNewGame(resizedImage)
    }

    const startNewGame = (imagedata: string) => {
        // Reset Local State
        setCurrentImage(imagedata)
        const newPieces = generateBoard()
        setPieces(newPieces)
        setIsComplete(false)
        setGameState('PLAYING')

        // Broadcast NEW_GAME
        if (connRef.current) {
            connRef.current.send({
                type: 'NEW_GAME',
                image: imagedata,
                pieces: newPieces,
                senderId: localPlayerIdRef.current
            })
        }
    }

    const handleSolve = (shouldBroadcast: boolean) => {
        setIsComplete(true)
        setChatUnlocked(true)
        setGameState('COMPLETED')
        if (shouldBroadcast) broadcastComplete()

        // Celebrate!
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-8">
            {/* Header */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-12">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Zap size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">INSTANT PUZZLE</h1>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Collaborative Solve</p>
                    </div>
                </Link>

                <div className="flex gap-4">
                    <div className="flex gap-4">
                        {/* Header Actions if any */}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
                {/* Left Side: Game/Lobby */}
                <div className="space-y-8 order-2 lg:order-1">
                    <AnimatePresence mode="wait">
                        {gameState === 'LOBBY' && (
                            <motion.div
                                key="lobby"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-6 md:p-12 flex flex-col items-center text-center space-y-8 min-h-[500px] justify-center"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl"><div className="w-64 h-64 bg-primary rounded-full" /></div>
                                <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center rotate-6 shadow-2xl shadow-primary/20 relative z-10"><Zap size={48} className="text-primary" /></div>
                                <div className="space-y-4 relative z-10">
                                    <h2 className="text-5xl font-black tracking-tighter">Teamwork Starts Here</h2>
                                    <p className="text-lg text-muted-foreground max-w-sm mx-auto">Set your profile and find a teammate.</p>
                                </div>

                                {/* Profile Form */}
                                <div className="w-full max-w-sm space-y-6 relative z-10 bg-background/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-2xl">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block text-left ml-2">What's your name?</label>
                                        <input
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Your name..."
                                            className="w-full bg-background/50 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block text-left ml-2">Your Gender</label>
                                            <select
                                                value={userGender}
                                                onChange={(e) => setUserGender(e.target.value)}
                                                className="w-full bg-background/50 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50 block text-left ml-2">Match With</label>
                                            <select
                                                value={matchPreference}
                                                onChange={(e) => setMatchPreference(e.target.value)}
                                                className="w-full bg-background/50 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Any</option>
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        onClick={startMatchmaking}
                                        className="w-full group relative px-8 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30 overflow-hidden"
                                    >
                                        <span className="relative z-10 uppercase tracking-tighter">Enter Lobby</span>
                                        <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                    </button>
                                </div>
                                <div className="flex gap-8 text-xs font-bold text-muted-foreground mt-8"><div className="flex items-center gap-2"><Users size={16} className="text-primary" />INSTANT MATCH</div><div className="flex items-center gap-2"><Sparkles size={16} className="text-primary" />CHAT REWARD</div></div>
                            </motion.div>
                        )}
                        {gameState === 'MATCHING' && (
                            <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-[2.5rem] bg-card/50 border border-border p-12 flex flex-col items-center justify-center min-h-[500px] space-y-8">
                                <div className="relative"><Loader2 size={80} className="text-primary animate-spin" /><div className="absolute inset-0 flex items-center justify-center"><Users size={32} className="text-primary" /></div></div>
                                <div className="text-center space-y-4">
                                    <h2 className="text-3xl font-black tracking-tight animate-pulse">FINDING TEAMMATE</h2>
                                    <p className="text-muted-foreground">Connecting to the global puzzle network...</p>
                                    {debugInfo && (
                                        <p className="text-primary text-xs font-mono bg-primary/10 px-4 py-2 rounded-lg inline-block">
                                            {debugInfo}
                                        </p>
                                    )}
                                    {connectionStatus === 'CONNECTING' && (
                                        <p className="text-yellow-500 text-xs font-bold animate-pulse">
                                            MATCH FOUND! ESTABLISHING P2P LINK...
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {(gameState === 'PLAYING' || gameState === 'COMPLETED') && (
                            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" /><span className="text-[10px] font-black text-primary uppercase">P2P Sync</span></div>
                                        <div className="flex items-center gap-1.5 text-xs font-bold opacity-60"><Users size={12} />Partner: <span className="text-primary">{partnerName}</span></div>
                                    </div>
                                    {gameState === 'COMPLETED' && (
                                        <div className="flex items-center gap-2">
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 text-[10px] font-black flex items-center gap-1.5">
                                                <Trophy size={12} />SOLVED!
                                            </motion.div>

                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                />
                                                <button className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5">
                                                    <Sparkles size={12} />
                                                    Play Again
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* PUZZLE BOARD */}
                                <div className="w-full">
                                    <PuzzleBoard
                                        pieces={pieces}
                                        setPieces={setPieces}
                                        onBroadcastMove={broadcastMove}
                                        roomId={roomId}
                                        localPlayerId={localPlayerId}
                                        isComplete={isComplete}
                                        imageUrl={currentImage}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Chat & Video */}
                <aside className="space-y-6 flex flex-col h-full w-full lg:sticky lg:top-8 order-1 lg:order-2">
                    {/* VIDEO CHAT */}
                    {(localStream || remoteStream) && (
                        <VideoChat
                            localStream={localStream}
                            remoteStream={remoteStream}
                            isMuted={isMuted}
                            isVideoOff={isVideoOff}
                            onToggleMute={toggleMute}
                            onToggleVideo={toggleVideo}
                        />
                    )}

                    <InstantChat
                        isUnlocked={chatUnlocked || isComplete}
                        roomId={roomId}
                        playerId={localPlayerId}
                        messages={messages}
                        onSendMessage={sendMessage}
                        partnerName={partnerName}
                        onStartVideoCall={() => {
                            if (connRef.current) {
                                startVideoCall(connRef.current.peer)
                            }
                        }}
                        isVideoCallActive={!!localStream}
                    />
                </aside>
            </main>
        </div>
    )
}
