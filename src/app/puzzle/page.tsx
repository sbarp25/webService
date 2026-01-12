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

export default function PuzzlePage() {
    const [gameState, setGameState] = useState<GameState>('LOBBY')
    const [isComplete, setIsComplete] = useState(false)
    const [roomId, setRoomId] = useState<string>('')
    const [localPlayerId] = useState(() => "user-" + Math.random().toString(36).substr(2, 5))
    // PeerJS State
    const [peerId, setPeerId] = useState<string>('')
    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<DataConnection | null>(null)

    // Game State
    const [onlineCount, setOnlineCount] = useState(1243) // Mock count since we lost Pusher presence
    const [messages, setMessages] = useState<any[]>([])
    const [pieces, setPieces] = useState<Piece[]>([])

    // User Profile for Matchmaking
    const [userName, setUserName] = useState('')
    const [userGender, setUserGender] = useState('Male')
    const [matchPreference, setMatchPreference] = useState('Any')
    const [partnerName, setPartnerName] = useState('Partner')

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
        })

        peer.on('connection', (conn) => {
            console.log('--- PeerJS: Incoming connection from', conn.peer)
            handleConnection(conn)
        })

        peer.on('error', (err) => {
            console.error('--- PeerJS Error:', err)
        })

        peerRef.current = peer

        return () => {
            peer.destroy()
        }
    }, [])

    // 2. Handle Incoming/Outgoing Connection
    const handleConnection = (conn: DataConnection) => {
        connRef.current = conn

        conn.on('open', () => {
            console.log('--- PeerJS: Connection Open! ---')
        })

        conn.on('data', (data: any) => {
            console.log('--- PeerJS: Data Received ---', data)
            handleGameData(data)
        })

        conn.on('close', () => {
            console.log('--- PeerJS: Connection Closed ---')
            alert('Partner disconnected!')
            setGameState('LOBBY')
            setPieces([])
            setMessages([])
        })

        conn.on('error', (err) => {
            console.error('--- PeerJS Connection Error:', err)
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
                    ? { ...p, currentPos: data.currentPos, lastMovedBy: data.senderId, isLocked: data.isLocked || p.isLocked }
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
                initialPieces.push({
                    id,
                    targetPos: { x: col * PIECE_WIDTH, y: row * PIECE_HEIGHT },
                    currentPos: {
                        x: Math.random() * 200 + 450,
                        y: Math.random() * 200 + 50
                    },
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
        })

        handleConnection(conn)
    }


    // 5. Game Actions
    const broadcastMove = (pieceId: number, currentPos: { x: number, y: number }, isLocked: boolean) => {
        if (connRef.current) {
            connRef.current.send({ type: 'move', pieceId, currentPos, senderId: localPlayerId, isLocked })
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

    const handleSolve = (shouldBroadcast: boolean) => {
        setIsComplete(true)
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
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-card rounded-2xl border border-border">
                        <div className="flex -space-x-2">
                            {[1, 2].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i === 1 ? 'Felix' : 'Anita'}`} alt="avatar" />
                                </div>
                            ))}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">{onlineCount} Online Now</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="w-full max-w-6xl grid lg:grid-cols-[1fr_350px] gap-8 items-start">
                {/* Left Side: Game/Lobby */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {gameState === 'LOBBY' && (
                            <motion.div
                                key="lobby"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 p-12 flex flex-col items-center text-center space-y-8 min-h-[500px] justify-center"
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
                                <div className="text-center space-y-2"><h2 className="text-3xl font-black tracking-tight animate-pulse">FINDING TEAMMATE</h2><p className="text-muted-foreground">Connecting to the global puzzle network...</p></div>
                            </motion.div>
                        )}
                        {(gameState === 'PLAYING' || gameState === 'COMPLETED') && (
                            <motion.div key="game" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full animate-ping" /><span className="text-sm font-black text-primary uppercase">Peer2Peer Sync</span></div>
                                        <div className="flex items-center gap-2 text-sm font-bold opacity-60"><Users size={16} />Active Partner: <span className="text-primary">{partnerName}</span></div>
                                    </div>
                                    {gameState === 'COMPLETED' && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-6 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 font-black flex items-center gap-2"><Trophy size={18} />PUZZLE SOLVED!</motion.div>)}
                                </div>
                                <PuzzleBoard pieces={pieces} setPieces={setPieces} onBroadcastMove={broadcastMove} roomId={roomId} localPlayerId={localPlayerId} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Chat */}
                <aside className="space-y-6 flex flex-col h-full lg:sticky lg:top-8">
                    <InstantChat isUnlocked={isComplete} roomId={roomId} playerId={localPlayerId} messages={messages} onSendMessage={sendMessage} partnerName={partnerName} />
                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Global Solves</h4>
                        <div className="space-y-3">
                            {[{ name: 'Sarah & Tom', time: '1m 24s', pts: '+250' }, { name: 'Mike & Leo', time: '2m 10s', pts: '+200' }, { name: 'Elena & Jo', time: '48s', pts: '+500' },].map((solve, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black group-hover:bg-primary/20 transition-colors">{solve.pts}</div>
                                        <span className="text-sm font-bold">{solve.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black opacity-40">{solve.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    )
}

