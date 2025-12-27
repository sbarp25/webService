"use client"

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export interface Piece {
    id: number
    currentPos: { x: number; y: number }
    targetPos: { x: number; y: number }
    isLocked: boolean
    lastMovedBy?: string
}

const GRID_SIZE = { cols: 4, rows: 3 }
const PIECE_WIDTH = 100
const PIECE_HEIGHT = 100
const SNAP_THRESHOLD = 20

export default function PuzzleBoard({
    imageUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
    roomId = "demo",
    localPlayerId = "player-default",
    pieces,
    setPieces,
    onBroadcastMove
}: {
    imageUrl?: string,
    roomId?: string,
    localPlayerId: string,
    pieces: Piece[],
    setPieces: React.Dispatch<React.SetStateAction<Piece[]>>,
    onBroadcastMove: (pieceId: number, currentPos: { x: number, y: number }, isLocked: boolean) => void
}) {
    const containerRef = useRef<HTMLDivElement>(null)

    const handleDragEnd = (id: number, info: any) => {
        const piece = pieces.find(p => p.id === id)
        if (!piece || piece.isLocked) return

        const newX = piece.currentPos.x + info.offset.x
        const newY = piece.currentPos.y + info.offset.y
        const finalPos = { x: newX, y: newY }

        // Check if close to target
        const distance = Math.sqrt(
            Math.pow(newX - piece.targetPos.x, 2) +
            Math.pow(newY - piece.targetPos.y, 2)
        )

        if (distance < SNAP_THRESHOLD) {
            const snappedPos = piece.targetPos
            setPieces(prev => prev.map(p =>
                p.id === id ? { ...p, currentPos: snappedPos, isLocked: true } : p
            ))
            onBroadcastMove(id, snappedPos, true)
        } else {
            setPieces(prev => prev.map(p =>
                p.id === id ? { ...p, currentPos: finalPos } : p
            ))
            onBroadcastMove(id, finalPos, false)
        }
    }

    return (
        <div className="relative w-full h-[600px] bg-secondary/20 rounded-3xl overflow-hidden border border-border/50 backdrop-blur-sm shadow-inner" ref={containerRef}>
            {/* Target Area Outline */}
            <div
                className="absolute top-0 left-0 border-2 border-dashed border-primary/20 rounded-xl"
                style={{
                    width: GRID_SIZE.cols * PIECE_WIDTH,
                    height: GRID_SIZE.rows * PIECE_HEIGHT,
                    background: "rgba(var(--primary), 0.02)"
                }}
            />

            {/* Pieces */}
            {pieces.map((piece) => (
                <motion.div
                    key={piece.id}
                    drag={!piece.isLocked}
                    dragMomentum={false}
                    onDragEnd={(_, info) => handleDragEnd(piece.id, info)}
                    initial={false}
                    animate={{
                        x: piece.currentPos.x,
                        y: piece.currentPos.y,
                        scale: piece.isLocked ? 1 : 1.05,
                        rotate: piece.isLocked ? 0 : (piece.id % 10 - 5),
                        boxShadow: piece.isLocked
                            ? "none"
                            : "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                        zIndex: piece.isLocked ? 0 : 50
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border border-white/10"
                    style={{
                        width: PIECE_WIDTH,
                        height: PIECE_HEIGHT,
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${GRID_SIZE.cols * 100}% ${GRID_SIZE.rows * 100}%`,
                        backgroundPosition: `-${(piece.id % GRID_SIZE.cols) * 100}% -${Math.floor(piece.id / GRID_SIZE.cols) * 100}%`,
                    }}
                >
                    {piece.isLocked && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-primary/5 border border-primary/20"
                        />
                    )}
                </motion.div>
            ))}

            {/* Ghost Piece Indicator */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border rounded-full text-xs font-medium text-muted-foreground">
                <Users size={14} className="text-primary" />
                Collaborating...
            </div>
        </div>
    )
}
