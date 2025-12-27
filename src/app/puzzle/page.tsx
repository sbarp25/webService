"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Users, Trophy, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import PuzzleBoard from '@/components/puzzle/PuzzleBoard'
import InstantChat from '@/components/puzzle/InstantChat'
import Link from 'next/link'
import confetti from 'canvas-confetti'

import { pusherClient } from '@/lib/pusher'

type GameState = 'LOBBY' | 'MATCHING' | 'PLAYING' | 'COMPLETED'
//ok
export default function PuzzlePage() {
    const [gameState, setGameState] = useState<GameState>('LOBBY')
    const [isComplete, setIsComplete] = useState(false)
    const [roomId, setRoomId] = useState<string>('')
    const [playerId] = useState(() => "user-" + Math.random().toString(36).substr(2, 5))
    const [partnerName, setPartnerName] = useState('Anita') // Default mock
    const [onlineCount, setOnlineCount] = useState(0)
    const [messages, setMessages] = useState<any[]>([])
    const [localPlayerId] = useState(playerId)

    useEffect(() => {
        // Global Lobby for online count
        const channel = pusherClient.subscribe('presence-lobby')

        channel.bind('pusher:subscription_succeeded', (members: any) => {
            setOnlineCount(members.count)
        })

        channel.bind('pusher:member_added', () => {
            // @ts-ignore
            setOnlineCount(channel.members.count)
        })

        channel.bind('pusher:member_removed', () => {
            // @ts-ignore
            setOnlineCount(channel.members.count)
        })

        return () => {
            pusherClient.unsubscribe('presence-lobby')
        }
    }, [])

    const startMatchmaking = () => {
        setGameState('MATCHING')

        const matchChannel = pusherClient.subscribe('presence-searching')

        const startIfReady = (members: any) => {
            if (members.count >= 2) {
                const memberIds = Object.keys(members.members).sort()
                const hostId = memberIds[0]
                const guestId = memberIds[1]
                console.log('Match Ready! Member IDs:', memberIds)
                const generatedRoomId = `game-${hostId}-${guestId}`
                console.log('Generated Room ID:', generatedRoomId)
                console.log('Local Player ID:', playerId)

                setRoomId(generatedRoomId)
                setGameState('PLAYING')
                pusherClient.unsubscribe('presence-searching')
            }
        }

        matchChannel.bind('pusher:subscription_succeeded', (members: any) => {
            console.log('--- Matchmaking: Subscribed! Members:', members)
            setOnlineCount(members.count)
            // @ts-ignore
            startIfReady(matchChannel.members)
        })

        matchChannel.bind('pusher:member_added', (member: any) => {
            console.log('--- Matchmaking: Member Joined:', member)
            // @ts-ignore
            startIfReady(matchChannel.members)
        })

        matchChannel.bind('pusher:subscription_error', (error: any) => {
            console.error('--- Matchmaking: Pusher Subscription Error:', error)
            setGameState('LOBBY')
        })
    }

    useEffect(() => {
        if (!roomId) return

        console.log(`--- Game: Subscribing to room-${roomId} ---`)
        const channel = pusherClient.subscribe(`room-${roomId}`)

        channel.bind('new-message', (data: { text: string, senderId: string, timestamp: string }) => {
            console.log('--- Game: Message Received ---', data)
            if (data.senderId !== localPlayerId) {
                setMessages(prev => [...prev, {
                    id: Math.random().toString(36),
                    text: data.text,
                    sender: 'partner',
                    timestamp: new Date(data.timestamp),
                    senderId: data.senderId
                }])
            }
        })

        return () => {
            console.log(`--- Game: Unsubscribing from room-${roomId} ---`)
            pusherClient.unsubscribe(`room-${roomId}`)
        }
    }, [roomId, localPlayerId])

    const sendMessage = async (text: string) => {
        if (!text.trim() || !roomId) return
        const newMessage = { id: Math.random().toString(36), text, sender: 'me' as const, timestamp: new Date() }
        setMessages(prev => [...prev, newMessage])
        try {
            await fetch('/api/puzzle/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, text, senderId: localPlayerId })
            })
        } catch (e) {
            console.error('Failed to send message', e)
        }
    }

    const handleSolve = () => {
        setIsComplete(true)
        setGameState('COMPLETED')

        // Celebrate!
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

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
                        <span className="text-xs font-bold text-muted-foreground">{onlineCount > 0 ? (onlineCount + 1204) : 1204} Online Now</span>
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
                                <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl">
                                    <div className="w-64 h-64 bg-primary rounded-full" />
                                </div>

                                <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center rotate-6 shadow-2xl shadow-primary/20 relative z-10">
                                    <Zap size={48} className="text-primary" />
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <h2 className="text-5xl font-black tracking-tighter">Teamwork Starts Here</h2>
                                    <p className="text-lg text-muted-foreground max-w-sm mx-auto"> Pair up instantly to solve a photo puzzle and unlock a private chat with your teammate.</p>
                                </div>

                                <button
                                    onClick={startMatchmaking}
                                    className="group relative px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 overflow-hidden"
                                >
                                    <span className="relative z-10">FIND A PARTNER</span>
                                    <ArrowRight size={24} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                </button>

                                <div className="flex gap-8 text-xs font-bold text-muted-foreground mt-8">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-primary" />
                                        INSTANT MATCH
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className="text-primary" />
                                        CHAT REWARD
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameState === 'MATCHING' && (
                            <motion.div
                                key="matching"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-[2.5rem] bg-card/50 border border-border p-12 flex flex-col items-center justify-center min-h-[500px] space-y-8"
                            >
                                <div className="relative">
                                    <Loader2 size={80} className="text-primary animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Users size={32} className="text-primary" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-3xl font-black tracking-tight animate-pulse">FINDING TEAMMATE</h2>
                                    <p className="text-muted-foreground">Connecting to the global puzzle network...</p>
                                </div>
                            </motion.div>
                        )}

                        {(gameState === 'PLAYING' || gameState === 'COMPLETED') && (
                            <motion.div
                                key="game"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                            <span className="text-sm font-black text-primary uppercase">Live Syncing</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold opacity-60">
                                            <Users size={16} />
                                            Active Partner: <span className="text-primary">Anita</span>
                                        </div>
                                    </div>

                                    {gameState === 'COMPLETED' && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="px-6 py-2 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 font-black flex items-center gap-2"
                                        >
                                            <Trophy size={18} />
                                            PUZZLE SOLVED!
                                        </motion.div>
                                    )}
                                </div>

                                <PuzzleBoard
                                    onComplete={handleSolve}
                                    roomId={roomId}
                                    playerId={localPlayerId}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Side: Chat & Stats */}
                <aside className="space-y-6 flex flex-col h-full lg:sticky lg:top-8">
                    <InstantChat
                        isUnlocked={isComplete}
                        roomId={roomId}
                        playerId={localPlayerId}
                        messages={messages}
                        onSendMessage={sendMessage}
                    />

                    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Global Solves</h4>
                        <div className="space-y-3">
                            {[
                                { name: 'Sarah & Tom', time: '1m 24s', pts: '+250' },
                                { name: 'Mike & Leo', time: '2m 10s', pts: '+200' },
                                { name: 'Elena & Jo', time: '48s', pts: '+500' },
                            ].map((solve, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black group-hover:bg-primary/20 transition-colors">
                                            {solve.pts}
                                        </div>
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
