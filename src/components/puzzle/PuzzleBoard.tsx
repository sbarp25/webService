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
    const [boardSize, setBoardSize] = React.useState({ width: 0, height: 0 })

    // Track container size
    React.useEffect(() => {
        if (!containerRef.current) return
        const updateSize = () => {
            if (containerRef.current) {
                setBoardSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                })
            }
        }

        // Initial
        updateSize()

        // Resize Observer
        const observer = new ResizeObserver(updateSize)
        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [])

    const handleDragEnd = (id: number, info: any) => {
        const piece = pieces.find(p => p.id === id)
        if (!piece || piece.isLocked || boardSize.width === 0) return

        // 1. Calculate Current Pixel Position (Start of drag)
        const currentPixelX = (piece.currentPos.x / 100) * boardSize.width
        const currentPixelY = (piece.currentPos.y / 100) * boardSize.height

        // 2. Add Drag Delta (info.offset)
        const newPixelX = currentPixelX + info.offset.x
        const newPixelY = currentPixelY + info.offset.y

        // 3. Convert back to Percentages
        const newPercentX = (newPixelX / boardSize.width) * 100
        const newPercentY = (newPixelY / boardSize.height) * 100

        // 4. Snap Logic (Distance in Percent)
        const diffX = newPercentX - piece.targetPos.x
        const diffY = newPercentY - piece.targetPos.y
        const distPercent = Math.sqrt(diffX * diffX + diffY * diffY)

        const SNAP_TOLERANCE_PERCENT = 5

        if (distPercent < SNAP_TOLERANCE_PERCENT) {
            const snappedPos = piece.targetPos
            setPieces(prev => prev.map(p =>
                p.id === id ? { ...p, currentPos: snappedPos, isLocked: true } : p
            ))
            onBroadcastMove(id, snappedPos, true)
        } else {
            setPieces(prev => prev.map(p =>
                p.id === id ? { ...p, currentPos: { x: newPercentX, y: newPercentY } } : p
            ))
            onBroadcastMove(id, { x: newPercentX, y: newPercentY }, false)
        }
    }

    return (
        <div className="relative w-full aspect-[4/3] bg-secondary/20 rounded-3xl overflow-hidden border border-border/50 backdrop-blur-sm shadow-inner" ref={containerRef}>
            {/* Target Area Outline */}
            <div
                className="absolute top-0 left-0 w-full h-full border-2 border-dashed border-primary/20 rounded-xl"
                style={{
                    background: "rgba(var(--primary), 0.02)"
                }}
            />

            {/* Pieces */}
            {pieces.map((piece) => {
                // Calculate Pixel Position for Render
                const renderX = (piece.currentPos.x / 100) * boardSize.width
                const renderY = (piece.currentPos.y / 100) * boardSize.height

                return (
                    <motion.div
                        key={piece.id}
                        drag={!piece.isLocked}
                        dragMomentum={false}
                        dragElastic={0}
                        dragConstraints={containerRef}
                        onDragEnd={(_, info) => handleDragEnd(piece.id, info)}
                        initial={false}
                        animate={{
                            x: boardSize.width ? renderX : 0, // Wait for size
                            y: boardSize.height ? renderY : 0,
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
                            width: '25%', // 100% / 4 cols
                            height: '33.33%', // 100% / 3 rows
                            top: 0,
                            left: 0,
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
                )
            })}

            {/* Ghost Piece Indicator */}
            <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-md border border-border rounded-full text-xs font-medium text-muted-foreground pointer-events-none">
                <Users size={14} className="text-primary" />
                Collaborating...
            </div>
        </div>
    )
}
