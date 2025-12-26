"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Hash, UserCircle2 } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'

interface Message {
    id: string
    text: string
    sender: 'me' | 'partner'
    timestamp: Date
    senderId?: string
}

export default function InstantChat({
    isUnlocked,
    roomId = "demo",
    playerId = "player-" + Math.random().toString(36).substr(2, 5)
}: {
    isUnlocked: boolean,
    roomId?: string,
    playerId?: string
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const channel = pusherClient.subscribe(`room-${roomId}`)
        channel.bind('new-message', (data: { text: string, senderId: string, timestamp: string }) => {
            if (data.senderId !== playerId) {
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
            pusherClient.unsubscribe(`room-${roomId}`)
        }
    }, [roomId, playerId])

    const handleSend = async () => {
        if (!input.trim()) return
        const text = input
        setInput('')

        // Optimistic update
        setMessages(prev => [...prev, {
            id: Math.random().toString(36),
            text: text,
            sender: 'me',
            timestamp: new Date()
        }])

        try {
            await fetch('/api/puzzle/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, message: text, senderId: playerId })
            })
        } catch (e) {
            console.error('Failed to send message', e)
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className={`flex flex-col h-[400px] w-full max-w-md bg-card border border-border rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ${!isUnlocked ? 'blur-md pointer-events-none opacity-50 grayscale' : 'opacity-100'}`}>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-primary/5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCircle2 className="text-primary" size={20} />
                    <div>
                        <h4 className="text-sm font-bold">Partner Chat</h4>
                        <p className="text-[10px] text-muted-foreground">Teamwork rewarded!</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">Live</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                <AnimatePresence>
                    {messages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground italic text-sm">
                            Say hello to your teammate!
                        </div>
                    )}
                    {messages.map((m) => (
                        <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${m.sender === 'me'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-secondary text-secondary-foreground rounded-tl-none'
                                }`}>
                                {m.text}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-4 bg-muted/30 border-t border-border">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isUnlocked ? "Type a message..." : "Solve the puzzle to chat"}
                        disabled={!isUnlocked}
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!isUnlocked}
                        className="p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
