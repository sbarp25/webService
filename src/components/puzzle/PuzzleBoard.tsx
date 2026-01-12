"use client"

import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export interface Piece {
    id: number
    position: { x: number; y: number } // 0-100% of Container
    targetPos: { x: number; y: number } // 0-100% of Board
    container: 'board' | 'tray'
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
    onBroadcastMove,
    isComplete = false
}: {
    imageUrl?: string,
    roomId?: string,
    localPlayerId: string,
    pieces: Piece[],
    setPieces: React.Dispatch<React.SetStateAction<Piece[]>>,
    onBroadcastMove: (pieceId: number, position: { x: number, y: number }, container: 'board' | 'tray', isLocked: boolean) => void,
    isComplete?: boolean
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [boardRect, setBoardRect] = React.useState({ width: 0, height: 0, top: 0, left: 0 })
    const [trayRect, setTrayRect] = React.useState({ width: 0, height: 0, top: 0, left: 0 })
    const [isMobile, setIsMobile] = React.useState(false)

    // Layout Logic
    const updateLayout = () => {
        if (!containerRef.current) return
        const { offsetWidth: w, offsetHeight: h } = containerRef.current
        const mobile = w < 768 // Standard MD breakpoint or custom logic

        setIsMobile(mobile)

        if (isComplete) {
            // Full Screen Board, No Tray
            setBoardRect({ width: w, height: h, top: 0, left: 0 })
            setTrayRect({ width: 0, height: 0, top: 0, left: 0 })
        } else {
            // Define Zones based on Mobile/Desktop
            if (mobile) {
                // Mobile: Tray Top (25%), Board Bottom (75%)
                // Actually user wanted "Upper Section" for tray.
                setTrayRect({ width: w, height: h * 0.25, top: 0, left: 0 })
                setBoardRect({ width: w, height: h * 0.75, top: h * 0.25, left: 0 })
            } else {
                // Desktop: Board Left (70%), Tray Right (30%)
                setBoardRect({ width: w * 0.7, height: h, top: 0, left: 0 })
                setTrayRect({ width: w * 0.3, height: h, top: 0, left: w * 0.7 })
            }
        }
    }

    React.useEffect(() => {
        updateLayout()
        window.addEventListener('resize', updateLayout)
        const observer = new ResizeObserver(updateLayout)
        if (containerRef.current) observer.observe(containerRef.current)
        return () => {
            window.removeEventListener('resize', updateLayout)
            observer.disconnect()
        }
    }, [isComplete]) // Dep on isComplete to trigger layout shift

    const handleDragEnd = (id: number, info: any) => {
        const piece = pieces.find(p => p.id === id)
        if (!piece || piece.isLocked) return

        // Info provides delta. We need absolute drop point relative to Container.
        // Framer Motion 'dragNode' or direct ref checking is best.
        // We can estimate drop point by: Current Visual Pos + Delta.

        // 1. Current Visual Pos (Pixels)
        const currentZone = piece.container === 'board' ? boardRect : trayRect
        const startX = currentZone.left + (piece.position.x / 100) * currentZone.width
        const startY = currentZone.top + (piece.position.y / 100) * currentZone.height

        const dropX = startX + info.offset.x
        const dropY = startY + info.offset.y

        // Bounds Checking (Prevent going out of Container)
        if (!containerRef.current) return
        const { offsetWidth: maxW, offsetHeight: maxH } = containerRef.current

        // Piece visual size (approx) - needed for bottom/right bound
        // We use Board pieces size for calculating logic generally
        const pW = boardRect.width / GRID_SIZE.cols
        const pH = boardRect.height / GRID_SIZE.rows

        // Clamp Drop Position within Container
        // Allow slight overhang (e.g. half piece) for UX, or strict?
        // User asked "not let puzzles go out of our box". Strict.
        const clampedDropX = Math.max(0, Math.min(dropX, maxW - pW))
        const clampedDropY = Math.max(0, Math.min(dropY, maxH - pH))

        // 2. Determine New Container
        // Check if drop is inside Board Rect
        const inBoard =
            clampedDropX >= boardRect.left &&
            clampedDropX <= boardRect.left + boardRect.width - pW / 2 && // Fuzzy boundary
            clampedDropY >= boardRect.top &&
            clampedDropY <= boardRect.top + boardRect.height - pH / 2

        const newContainer = inBoard ? 'board' : 'tray'
        // If complete, force board? (Though drag shouldn't happen if locked, but just in case)
        if (isComplete && newContainer === 'tray') return

        const targetZone = inBoard ? boardRect : trayRect

        // 3. Calculate New % Position relative to New Container
        // Clamp to ensure it stays inside?
        const relativeX = clampedDropX - targetZone.left
        const relativeY = clampedDropY - targetZone.top

        const newPctX = (relativeX / targetZone.width) * 100
        const newPctY = (relativeY / targetZone.height) * 100

        // 4. Snap Check (Only if in Board)
        let finalPos = { x: newPctX, y: newPctY }
        let locked = false

        if (newContainer === 'board') {
            const dist = Math.sqrt(
                Math.pow(newPctX - piece.targetPos.x, 2) +
                Math.pow(newPctY - piece.targetPos.y, 2)
            )
            if (dist < 5) { // 5% Tolerance
                finalPos = piece.targetPos
                locked = true
            }
        }

        setPieces(prev => prev.map(p =>
            p.id === id ? { ...p, position: finalPos, container: newContainer, isLocked: locked } : p
        ))
        onBroadcastMove(id, finalPos, newContainer, locked)
    }

    return (
        <div className={`relative w-full ${isMobile ? 'aspect-[3/4]' : 'aspect-video'} bg-secondary/20 rounded-3xl overflow-hidden border border-border/50 backdrop-blur-sm shadow-inner transition-all duration-500`} ref={containerRef}>

            {/* 1. Board Zone Background */}
            <div
                className="absolute border-primary/20 transition-all duration-500"
                style={{
                    left: boardRect.left, top: boardRect.top, width: boardRect.width, height: boardRect.height,
                    background: "rgba(var(--primary), 0.02)",
                    borderRight: (!isComplete && !isMobile) ? '2px solid rgba(255,255,255,0.1)' : 'none',
                    borderTop: (!isComplete && isMobile) ? '2px solid rgba(255,255,255,0.1)' : 'none'
                }}
            >
                <div className="w-full h-full border-2 border-dashed border-primary/20 rounded-xl relative">
                    {/* Scale grid to match */}
                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20 pointer-events-none">
                        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="border border-primary/10"></div>)}
                    </div>
                </div>
            </div>

            {/* 2. Tray Zone Background */}
            <div
                className="absolute bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all duration-500"
                style={{
                    left: trayRect.left, top: trayRect.top, width: trayRect.width, height: trayRect.height,
                    opacity: isComplete ? 0 : 1,
                    pointerEvents: isComplete ? 'none' : 'auto'
                }}
            >
                <span className="text-[10px] font-bold tracking-widest text-white/20 uppercase pointer-events-none select-none rotate-0">
                    {isMobile ? 'Piece Tray' : 'Tray'}
                </span>
            </div>

            {/* 3. Pieces */}
            {pieces.map((piece) => {
                const zone = piece.container === 'board' ? boardRect : trayRect
                // Protect against 0 size init
                if (zone.width === 0) return null

                const pixelX = (piece.position.x / 100) * zone.width
                const pixelY = (piece.position.y / 100) * zone.height

                // Visual Position relative to CONTAINER (Top Left 0,0)
                const finalX = zone.left + pixelX
                const finalY = zone.top + pixelY

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
                            x: finalX,
                            y: finalY,
                            scale: piece.isLocked ? 1 : (piece.container === 'tray' ? 0.8 : 1.05),
                            rotate: piece.isLocked ? 0 : 0,
                            zIndex: piece.isLocked ? 0 : (piece.container === 'tray' ? 40 : 50)
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute cursor-grab active:cursor-grabbing rounded-lg overflow-hidden border border-white/10"
                        style={{
                            // Size Logic:
                            // Board Piece: 25% of Board Width, 33% of Board Height
                            // Tray Piece: ? Scale it down? Or keep Board Size?
                            // Let's force Board Dimensions even in Tray for consistency
                            width: boardRect.width / GRID_SIZE.cols,
                            height: boardRect.height / GRID_SIZE.rows,
                            top: 0,
                            left: 0,
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: `${boardRect.width}px ${boardRect.height}px`, // Map to current board size
                            backgroundPosition: `-${(piece.id % GRID_SIZE.cols) * (boardRect.width / GRID_SIZE.cols)}px -${Math.floor(piece.id / GRID_SIZE.cols) * (boardRect.height / GRID_SIZE.rows)}px`,
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
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur-md border border-border rounded-full text-[10px] font-medium text-muted-foreground pointer-events-none">
                <Users size={12} className="text-primary" />
                Wait for partner...
            </div>
        </div>
    )
}
