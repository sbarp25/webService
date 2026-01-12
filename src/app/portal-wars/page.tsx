"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Shield, Zap, Users, ArrowRight, Loader2, Target } from 'lucide-react'
import Link from 'next/link'
import Peer, { DataConnection } from 'peerjs'

interface Player {
    id: string
    x: number
    y: number
    vx: number // Velocity X
    vy: number // Velocity Y
    angle: number
    color: string
    hp: number
    isLocal: boolean
    targetX?: number // For Touch Tether
    targetY?: number // For Touch Tether
}

interface Missile {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    angle: number
    owner: string
    hp: number // Missiles can be destroyed by bullets
}

interface Bullet {
    id: string
    x: number
    y: number
    vx: number
    vy: number
    owner: string
    type: 'FOCUSED' | 'SPREAD'
}

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: string
    size: number
}

const WORLD_WIDTH = 800
const WORLD_HEIGHT = 600

export default function DuelPage() {
    // State
    const [gameState, setGameState] = useState<'LOBBY' | 'MATCHING' | 'PLAYING' | 'GAME_OVER'>('LOBBY')
    const [localPlayerId] = useState(() => "duelist-" + Math.random().toString(36).substr(2, 5))
    const [userName, setUserName] = useState('')
    const [peerId, setPeerId] = useState<string>('')
    const [lastMissileFired, setLastMissileFired] = useState(0)

    // Refs
    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<DataConnection | null>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestRef = useRef<number>(0)

    // Game State Ref
    const gameRef = useRef<{
        players: Map<string, Player>
        bullets: Bullet[]
        missiles: Missile[]
        particles: Particle[]
        keys: Set<string>
        canvas: { width: number, height: number }
        lastFired: number
        lastMissile: number
        lastTap: number
        shake: number
        isTouching: boolean
    }>({
        players: new Map(),
        bullets: [],
        missiles: [],
        particles: [],
        keys: new Set(),
        canvas: { width: 800, height: 600 },
        lastFired: 0,
        lastMissile: 0,
        lastTap: 0,
        shake: 0,
        isTouching: false
    })

    // Init PeerJS
    useEffect(() => {
        const peer = new Peer()
        peer.on('open', (id) => setPeerId(id))

        peer.on('connection', (conn) => {
            console.log('Incoming Portal Connection')
            handleConnection(conn)
        })

        peerRef.current = peer
        return () => peer.destroy()
    }, [])

    const handleConnection = (conn: DataConnection) => {
        connRef.current = conn
        conn.on('open', () => {
            console.log('Portal Opened!')
            startGame()
        })
        conn.on('data', (data: any) => {
            if (data.type === 'PLAYER_UPDATE' && data.id !== localPlayerId) {
                const state = gameRef.current
                const p = state.players.get(data.id)
                // Mirror X, Y, and Angle for 180-degree portal rotation
                const mirroredX = WORLD_WIDTH - data.x
                const mirroredY = -data.y // Remote exists in the space "above" the portal
                const mirroredAngle = (data.angle || 0) + Math.PI

                if (p) {
                    p.x = mirroredX
                    p.y = mirroredY
                    p.angle = mirroredAngle
                } else {
                    // Init Remote Player
                    state.players.set(data.id, {
                        id: data.id,
                        x: mirroredX,
                        y: mirroredY,
                        vx: 0, vy: 0,
                        angle: mirroredAngle,
                        color: ('#ef4444'),
                        hp: 100,
                        isLocal: false
                    })
                }
            } else if (data.type === 'BULLET_SPAWN') {
                // IGNORE remote spawn. Only show bullets when they cross the portal (BULLET_TRANSFER).
            } else if (data.type === 'BULLET_TRANSFER') {
                const state = gameRef.current
                state.bullets.push({
                    id: `portal-${Date.now()}`,
                    x: WORLD_WIDTH - data.x, // Consistent mirroring in World coordinates
                    y: 0,
                    vx: -data.vx,
                    vy: -data.vy,
                    owner: 'remote',
                    type: data.bulletType || 'FOCUSED'
                })
            } else if (data.type === 'PLAYER_HIT') {
                const state = gameRef.current
                state.players.forEach(p => {
                    if (p.id !== localPlayerId) {
                        p.hp -= data.damage
                    }
                })
            } else if (data.type === 'MISSILE_TRANSFER') {
                // Remapped logic for portal crossing
                const state = gameRef.current
                state.missiles.push({
                    ...data.missile,
                    x: WORLD_WIDTH - data.missile.x,
                    y: 0,
                    vx: -data.missile.vx,
                    vy: -data.missile.vy,
                    angle: data.missile.angle + Math.PI,
                    owner: 'remote'
                })
            } else if (data.type === 'GAME_RESTART') {
                startGame()
            }
        })
    }

    const startMatchmaking = async () => {
        if (!userName.trim()) return alert("Enter name!")
        setGameState('MATCHING')

        try {
            await fetch('/api/matchmaking/join', {
                method: 'POST',
                body: JSON.stringify({
                    userId: localPlayerId,
                    name: userName,
                    gender: 'Any',
                    preference: 'Any',
                    peerId: peerId,
                    gameType: 'PORTAL_WARS'
                })
            })

            const interval = setInterval(async () => {
                const res = await fetch('/api/matchmaking/poll', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: localPlayerId,
                        gender: 'Any',
                        preference: 'Any',
                        gameType: 'PORTAL_WARS'
                    })
                })
                const data = await res.json()
                if (data.matchFound && data.partner) {
                    clearInterval(interval)
                    connectToPartner(data.partner.peerId)
                }
            }, 2000)
        } catch (e) {
            console.error(e)
            setGameState('LOBBY')
        }
    }

    const connectToPartner = (id: string) => {
        if (!peerRef.current) return
        const conn = peerRef.current.connect(id)
        handleConnection(conn)
    }

    // --- GAME ENGINE ---

    const startGame = (isRematch = false) => {
        setGameState('PLAYING')
        const state = gameRef.current
        state.bullets = []
        state.missiles = []
        state.particles = []
        state.players.clear()

        state.players.set(localPlayerId, {
            id: localPlayerId,
            x: WORLD_WIDTH / 2,
            y: WORLD_HEIGHT * 0.8, // Start near bottom
            vx: 0,
            vy: 0,
            angle: 0,
            color: '#06b6d4',
            hp: 100,
            isLocal: true
        })

        if (isRematch && connRef.current?.open) {
            connRef.current.send({ type: 'GAME_RESTART' })
        }

        if (requestRef.current) cancelAnimationFrame(requestRef.current)
        requestRef.current = requestAnimationFrame(gameLoop)
    }

    const gameLoop = () => {
        update()
        draw()
        requestRef.current = requestAnimationFrame(gameLoop)
    }

    const update = () => {
        const state = gameRef.current
        const player = state.players.get(localPlayerId)
        if (!player) return

        // PHYSICS & MOVEMENT
        const FRICTION = 0.92
        const ACCEL = 0.8

        // Input Handling & Movement
        const prevX = player.x
        const prevY = player.y

        // DIRECT FOLLOW (LERP)
        if (state.isTouching && player.targetX !== undefined && player.targetY !== undefined) {
            const LERP_FACTOR = 0.15

            player.x += (player.targetX - player.x) * LERP_FACTOR
            player.y += (player.targetY - player.y) * LERP_FACTOR

            // Bank angle
            const dx = player.targetX - player.x
            player.angle = dx * 0.005

            // Auto Fire
            state.keys.add(' ')
        } else {
            // Keyboard Fallback
            let inputX = 0
            let inputY = 0
            if (state.keys.has('ArrowUp') || state.keys.has('w')) inputY -= 1
            if (state.keys.has('ArrowDown') || state.keys.has('s')) inputY += 1
            if (state.keys.has('ArrowLeft') || state.keys.has('a')) inputX -= 1
            if (state.keys.has('ArrowRight') || state.keys.has('d')) inputX += 1

            player.x += inputX * 8
            player.y += inputY * 8
            player.angle = inputX * 0.1

            if (!state.keys.has('Space')) state.keys.delete(' ')
        }

        // Calculate actual velocity for effects/collisions
        player.vx = player.x - prevX
        player.vy = player.y - prevY

        // Update Position
        player.x += player.vx
        player.y += player.vy

        // Screen Clamp (Bounce)
        // Screen Clamp
        if (player.x < 0) { player.x = 0; player.vx *= -0.5 }
        if (player.x > WORLD_WIDTH) { player.x = WORLD_WIDTH; player.vx *= -0.5 }
        if (player.y < 0) { player.y = 0; player.vy *= -0.5 }
        if (player.y > WORLD_HEIGHT) { player.y = WORLD_HEIGHT; player.vy *= -0.5 }

        // Particles (Thrusters)
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
        if (speed > 1) {
            for (let i = 0; i < 2; i++) {
                state.particles.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 2 - player.vx * 0.5,
                    vy: (Math.random() - 0.5) * 2 - player.vy * 0.5,
                    life: 1.0,
                    maxLife: 1.0,
                    color: '#06b6d4',
                    size: Math.random() * 3 + 1
                })
            }
        }

        // SHOOTING
        const now = Date.now()
        // Fire logic:
        // High Speed -> Spread Shot (Suppressive)
        // Low Speed -> Focused Shot (Precision)
        const fireRate = speed > 5 ? 100 : 250 // Fast fire when moving fast (spray)
        const bulletSpeed = speed > 5 ? 15 : 25

        if (state.keys.has(' ') && now - state.lastFired > fireRate) {
            state.lastFired = now
            state.shake = 2 // Screen Shake kick
            const bulletId = `${localPlayerId}-${now}`

            // Bullet Spread
            const spread = speed > 5 ? (Math.random() - 0.5) * 0.5 : 0

            state.bullets.push({
                id: bulletId,
                x: player.x,
                y: player.y - 20,
                vx: Math.sin(spread) * 5,
                vy: -bulletSpeed,
                owner: localPlayerId,
                type: speed > 5 ? 'SPREAD' : 'FOCUSED'
            })

            // Broadcast
            if (connRef.current?.open) {
                connRef.current.send({
                    type: 'BULLET_SPAWN',
                    x: player.x,
                    y: player.y - 20,
                    vx: Math.sin(spread) * 5,
                    vy: -bulletSpeed,
                    owner: localPlayerId,
                    bulletType: speed > 5 ? 'SPREAD' : 'FOCUSED'
                })
            }
        }

        // LAUNCH MISSILE (Manual on 'm' or double-tap)
        const canFireMissile = now - state.lastMissile > 5000
        if (state.keys.has('m') && canFireMissile) {
            state.lastMissile = now
            state.shake = 5
            const missileId = `missile-${localPlayerId}-${now}`
            state.missiles.push({
                id: missileId,
                x: player.x,
                y: player.y - 30,
                vx: 0,
                vy: -8, // Initial launch thrust
                angle: -Math.PI / 2,
                owner: localPlayerId,
                hp: 10
            })

            setLastMissileFired(now)
        }
        // One-shot missile trigger cleanup
        const canFire = now - state.lastMissile > 5000
        if (!canFire) state.keys.delete('m')

        // UPDATE MISSILES (Homing & Portal)
        const remotePlayer = Array.from(state.players.values()).find(p => !p.isLocal)
        for (let i = state.missiles.length - 1; i >= 0; i--) {
            const m = state.missiles[i]

            // Homing logic (Only homing on opponent)
            if (m.owner === localPlayerId && remotePlayer) {
                const dx = remotePlayer.x - m.x
                const dy = remotePlayer.y - m.y
                const targetAngle = Math.atan2(dy, dx)

                // Smoothly turn
                let angleDiff = targetAngle - m.angle
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2

                m.angle += angleDiff * 0.05
                m.vx = Math.cos(m.angle) * 6
                m.vy = Math.sin(m.angle) * 6
            } else {
                // Non-local missiles just move straight based on their vx/vy received
                m.x += m.vx
                m.y += m.vy
                m.angle = Math.atan2(m.vy, m.vx)
            }

            if (m.owner === localPlayerId) {
                m.x += m.vx
                m.y += m.vy
            }

            // Portal Crossing
            if (m.y < 0 && m.owner === localPlayerId) {
                state.missiles.splice(i, 1)
                if (connRef.current?.open) {
                    connRef.current.send({
                        type: 'MISSILE_TRANSFER',
                        missile: { ...m, y: 0 }
                    })
                }
                continue
            }

            // Hit Player (Missile vs Player)
            const localP = state.players.get(localPlayerId)
            if (localP && m.owner !== localPlayerId) {
                const dist = Math.sqrt((m.x - localP.x) ** 2 + (m.y - localP.y) ** 2)
                if (dist < 30) {
                    state.missiles.splice(i, 1)
                    localP.hp -= 25 // HEAVY DAMAGE
                    state.shake = 20
                    // Explosion particles
                    for (let j = 0; j < 20; j++) {
                        state.particles.push({
                            x: m.x, y: m.y,
                            vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                            life: 1.0, maxLife: 1.0, color: '#f97316', size: 6
                        })
                    }
                    if (connRef.current?.open) connRef.current.send({ type: 'PLAYER_HIT', damage: 25 })
                    if (localP.hp <= 0) setGameState('GAME_OVER')
                    continue
                }
            }

            // Offscreen
            if (m.y > WORLD_HEIGHT || m.x < 0 || m.x > WORLD_WIDTH) {
                state.missiles.splice(i, 1)
                continue
            }
        }

        // UPDATE BULLETS
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i]
            b.x += b.vx
            b.y += b.vy

            // Missile Interception (Bullet vs Missile)
            for (let j = state.missiles.length - 1; j >= 0; j--) {
                const m = state.missiles[j]
                const dist = Math.sqrt((b.x - m.x) ** 2 + (b.y - m.y) ** 2)
                if (dist < 25) {
                    state.bullets.splice(i, 1)
                    state.missiles.splice(j, 1)
                    // Small explosion
                    for (let k = 0; k < 5; k++) {
                        state.particles.push({
                            x: b.x, y: b.y,
                            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                            life: 0.5, maxLife: 0.5, color: '#fbbf24', size: 3
                        })
                    }
                    break
                }
            }
            if (!state.bullets[i] || state.bullets[i].id !== b.id) continue // Bullet already destroyed

            // Particles for Bullets
            if (Math.random() > 0.5) {
                state.particles.push({
                    x: b.x,
                    y: b.y,
                    vx: 0, vy: 0,
                    life: 0.5, maxLife: 0.5,
                    color: b.owner === localPlayerId ? '#06b6d4' : '#ef4444',
                    size: 2
                })
            }

            // Portal Logic (Transfer to remote at WORLD_WIDTH - x)
            if (b.y < 0 && b.owner === localPlayerId) {
                state.bullets.splice(i, 1)
                if (connRef.current?.open) {
                    connRef.current.send({
                        type: 'BULLET_TRANSFER',
                        x: b.x,
                        y: b.y,
                        vx: b.vx,
                        vy: b.vy,
                        owner: localPlayerId,
                        bulletType: b.type
                    })
                }
                continue
            }

            if (b.y > WORLD_HEIGHT || b.x < 0 || b.x > WORLD_WIDTH) {
                state.bullets.splice(i, 1)
                continue
            }

            // Collision
            const localPlayer = state.players.get(localPlayerId)
            if (localPlayer && b.owner !== localPlayerId) {
                const dx = b.x - localPlayer.x
                const dy = b.y - localPlayer.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < 20) {
                    state.bullets.splice(i, 1)
                    state.shake = 10 // Big shake on hit
                    const damage = b.type === 'FOCUSED' ? 15 : 5
                    localPlayer.hp -= damage

                    // Hit Particles
                    for (let k = 0; k < 10; k++) {
                        state.particles.push({
                            x: localPlayer.x,
                            y: localPlayer.y,
                            vx: (Math.random() - 0.5) * 10,
                            vy: (Math.random() - 0.5) * 10,
                            life: 1.0, maxLife: 1.0,
                            color: '#ef4444',
                            size: 4
                        })
                    }

                    if (connRef.current?.open) {
                        connRef.current.send({ type: 'PLAYER_HIT', damage })
                    }
                    if (localPlayer.hp <= 0) setGameState('GAME_OVER')
                }
            }
        }

        // UPDATE PARTICLES
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const p = state.particles[i]
            p.x += p.vx
            p.y += p.vy
            p.life -= 0.05
            if (p.life <= 0) state.particles.splice(i, 1)
        }

        // Screen Shake Decay
        if (state.shake > 0) state.shake *= 0.9

        // Broadcast Position
        if (connRef.current?.open) {
            connRef.current.send({
                type: 'PLAYER_UPDATE',
                id: localPlayerId,
                x: player.x,
                y: player.y,
                angle: player.angle
            })
        }
    }

    // Input Handling (Global Listeners for Mouse/Keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            gameRef.current.keys.add(e.key)
            if (e.key === ' ') gameRef.current.keys.add('Space')
            if (e.key === 'm' || e.key === 'M') gameRef.current.keys.add('m')
        }
        const handleKeyUp = (e: KeyboardEvent) => {
            gameRef.current.keys.delete(e.key)
            if (e.key === ' ') gameRef.current.keys.delete('Space')
            if (e.key === 'm' || e.key === 'M') gameRef.current.keys.delete('m')
        }

        const handleMouseMove = (e: MouseEvent) => {
            const canvas = canvasRef.current
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const state = gameRef.current
            const p = state.players.get(localPlayerId)

            if (p) {
                const scale = Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT)
                const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2
                const offsetY = (canvas.height - WORLD_HEIGHT * scale) / 2

                // Mouse Target scaled from screen to World space
                p.targetX = (e.clientX - rect.left - offsetX) / scale
                p.targetY = (e.clientY - rect.top - offsetY) / scale
            }
        }

        const handleMouseDown = (e: MouseEvent) => {
            gameRef.current.isTouching = true
            handleMouseMove(e) // Update target immediately
        }

        const handleMouseUp = () => {
            gameRef.current.isTouching = false
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [])
    const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const state = gameRef.current

        // Resize
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
            state.canvas = { width: canvas.width, height: canvas.height }
        }

        const shakeX = (Math.random() - 0.5) * state.shake
        const shakeY = (Math.random() - 0.5) * state.shake

        ctx.save()

        // Scale Coordinate System: Simulation (800x600) -> Viewport
        const scale = Math.min(canvas.width / WORLD_WIDTH, canvas.height / WORLD_HEIGHT)
        const offsetX = (canvas.width - WORLD_WIDTH * scale) / 2
        const offsetY = (canvas.height - WORLD_HEIGHT * scale) / 2

        ctx.translate(offsetX + shakeX, offsetY + shakeY)
        ctx.scale(scale, scale)

        // Clear entire viewport to prevent artifacts outside simulation area
        ctx.fillStyle = '#000'
        ctx.fillRect(-offsetX / scale, -offsetY / scale, canvas.width / scale, canvas.height / scale)

        // Clear simulation area (redundant but safe)
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

        // Grid
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 1 / scale // Maintain thin grid lines
        ctx.beginPath()
        for (let i = 0; i <= WORLD_WIDTH; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_HEIGHT); }
        for (let i = 0; i <= WORLD_HEIGHT; i += 50) { ctx.moveTo(0, i); ctx.lineTo(WORLD_WIDTH, i); }
        ctx.stroke()

        // Particles
        state.particles.forEach(p => {
            ctx.globalAlpha = p.life
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fill()
        })
        ctx.globalAlpha = 1.0



        // Define localP for subsequent use
        const localP = state.players.get(localPlayerId)

        // Bullets
        state.bullets.forEach(b => {
            ctx.fillStyle = b.owner === localPlayerId ? '#06b6d4' : '#ef4444'
            ctx.shadowBlur = 15
            ctx.shadowColor = ctx.fillStyle
            ctx.beginPath()
            ctx.arc(b.x, b.y, b.type === 'FOCUSED' ? 4 : 2, 0, Math.PI * 2)
            ctx.fill()
        })

        // MISSLES
        state.missiles.forEach(m => {
            ctx.save()
            ctx.translate(m.x, m.y)
            ctx.rotate(m.angle)

            // Missile Body
            ctx.fillStyle = m.owner === localPlayerId ? '#06b6d4' : '#ef4444'
            ctx.shadowBlur = 20
            ctx.shadowColor = ctx.fillStyle

            ctx.beginPath()
            ctx.moveTo(15, 0)
            ctx.lineTo(-10, -8)
            ctx.lineTo(-10, 8)
            ctx.closePath()
            ctx.fill()

            // Engine Glow
            ctx.fillStyle = '#f97316'
            ctx.beginPath()
            ctx.arc(-10, 0, 5, 0, Math.PI * 2)
            ctx.fill()

            ctx.restore()

            // Missle trail particles
            if (Math.random() > 0.3) {
                state.particles.push({
                    x: m.x, y: m.y,
                    vx: -m.vx * 0.2, vy: -m.vy * 0.2,
                    life: 0.4, maxLife: 0.4, color: '#f97316', size: 3
                })
            }
        })

        // LOCAL PLAYER
        if (localP) {
            drawPlayer(ctx, localP)
        }

        // REMOTE PLAYERS (Hidden from main, but logically exist)
        // Only draw effects/name tags if we wanted, but we agreed to HIDE them.

        ctx.restore() // End World Scaling and Shake

        // Radar stays at screen proportions
        drawRadar(ctx, state)
    }

    const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player) => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)

        ctx.shadowBlur = 20
        ctx.shadowColor = p.isLocal ? '#06b6d4' : '#ef4444'
        ctx.fillStyle = p.isLocal ? '#06b6d4' : '#ef4444'

        // Ship
        ctx.beginPath()
        ctx.moveTo(0, -20)
        ctx.lineTo(-15, 15)
        ctx.lineTo(0, 10) // Engine notch
        ctx.lineTo(15, 15)
        ctx.closePath()
        ctx.fill()

        ctx.restore()

        // HP Bar (Fixed Rotation)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.fillStyle = '#333'
        ctx.fillRect(-20, 30, 40, 4)
        ctx.fillStyle = p.hp > 50 ? '#22c55e' : '#ef4444'
        ctx.fillRect(-20, 30, 40 * (p.hp / 100), 4)
        ctx.restore()
    }

    const drawRadar = (ctx: CanvasRenderingContext2D, state: any) => {
        const radarSize = 150
        const padding = 20
        const radarX = padding
        const radarY = state.canvas.height - radarSize - padding

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2
        ctx.fillRect(radarX, radarY, radarSize, radarSize)
        ctx.strokeRect(radarX, radarY, radarSize, radarSize)

        // Mid Line
        ctx.beginPath()
        ctx.moveTo(radarX, radarY + radarSize / 2)
        ctx.lineTo(radarX + radarSize, radarY + radarSize / 2)
        ctx.stroke()

        state.players.forEach((p: Player) => {
            const relX = p.x / WORLD_WIDTH
            const relY = p.y / WORLD_HEIGHT

            // Unified Radar Placement: Local in bottom half, Remote in top half
            const finalX = radarX + relX * radarSize
            const finalY = radarY + (radarSize / 2) + (relY * (radarSize / 2))

            ctx.fillStyle = p.isLocal ? '#06b6d4' : '#ef4444'
            ctx.beginPath()
            ctx.arc(finalX, finalY, 3, 0, Math.PI * 2)
            ctx.fill()

            // Small Health Bar on Radar
            ctx.fillStyle = 'rgba(0,0,0,0.8)'
            ctx.fillRect(finalX - 10, finalY + 5, 20, 3)
            ctx.fillStyle = p.hp > 50 ? '#22c55e' : (p.hp > 25 ? '#eab308' : '#ef4444')
            ctx.fillRect(finalX - 10, finalY + 5, 20 * (p.hp / 100), 3)
        })

        // Missile Recharge Bar (for Local Player)
        const now = Date.now()
        const charge = Math.min(1, (now - state.lastMissile) / 5000)

        ctx.save()
        ctx.translate(radarX, radarY - 15)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, radarSize, 8)

        if (charge < 1) {
            ctx.fillStyle = '#fbbf24' // Yellow for charging
            ctx.fillRect(0, 0, radarSize * charge, 8)
            ctx.font = '8px font-mono'
            ctx.fillStyle = '#fff'
            ctx.fillText('RELOADING MISSILE...', 0, -4)
        } else {
            ctx.fillStyle = '#06b6d4' // Cyan for ready
            ctx.fillRect(0, 0, radarSize, 8)
            ctx.font = '8px font-mono'
            ctx.fillStyle = '#fff'
            ctx.fillText('MISSILE READY [M / 2-FINGERS]', 0, -4)

            // Pulsate effect
            ctx.strokeStyle = '#fff'
            ctx.globalAlpha = Math.sin(now / 100) * 0.5 + 0.5
            ctx.strokeRect(0, 0, radarSize, 8)
        }
        ctx.restore()
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono selection:bg-neon-blue selection:text-black overflow-hidden overscroll-none">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
                <Link href="/" className="pointer-events-auto flex items-center gap-2 text-2xl font-black tracking-tighter uppercase group">
                    <Crosshair className="text-cyan-500 group-hover:rotate-90 transition-transform" />
                    <span>Portal<span className="text-cyan-500">Wars</span></span>
                </Link>
                <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-zinc-500">
                    <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${peerId ? 'bg-green-500' : 'bg-red-500'}`} /> SERVER STATUS</div>
                </div>
            </div>

            {/* Content */}
            <main className="w-full h-screen relative">
                <AnimatePresence mode="wait">
                    {gameState === 'LOBBY' && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="max-w-md w-full bg-zinc-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <h2 className="text-4xl font-black mb-2 tracking-tighter">PORTAL WARS</h2>
                                <p className="text-zinc-400 mb-8">System Online</p>

                                <div className="space-y-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Codename</label>
                                        <input
                                            value={userName}
                                            onChange={e => setUserName(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 p-4 rounded-xl font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                                            placeholder="PILOT"
                                        />
                                    </div>
                                    <button
                                        onClick={startMatchmaking}
                                        className="w-full bg-cyan-500 text-black font-black py-4 rounded-xl hover:bg-cyan-400 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        INITIATE LINK <ArrowRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {gameState === 'MATCHING' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center z-10 text-center space-y-8">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-cyan-500/30 rounded-full animate-ping absolute inset-0" />
                                <div className="w-24 h-24 border-4 border-t-cyan-500 rounded-full animate-spin" />
                            </div>
                            <h2 className="text-xl font-bold tracking-widest animate-pulse mt-4">SEARCHING FOR OPPONENT...</h2>
                        </motion.div>
                    )}

                    {gameState === 'PLAYING' && (
                        <div className="w-full h-full relative">
                            {/* Overlay UI */}
                            <div className="absolute top-20 left-6 pointer-events-none opacity-50 text-xs font-mono">
                                <div>SYSTEM: DIRECT LINK</div>
                                <div className="text-cyan-500">STATUS: ENGAGED</div>
                            </div>

                            <div className="absolute bottom-[200px] left-6 pointer-events-none text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                                Drag to Move • Auto-Fire Engaged • [M] / 2-FINGERS for Missile
                            </div>

                            {/* Game Canvas */}
                            <canvas
                                ref={canvasRef}
                                className="w-full h-full block touch-none cursor-crosshair"
                                onMouseDown={() => { /* Handled globally */ }}
                                onMouseUp={() => { /* Handled globally */ }}
                                onTouchStart={(e) => {
                                    e.preventDefault()
                                    gameRef.current.isTouching = true
                                    const now = Date.now()
                                    const state = gameRef.current

                                    // Two-Finger Missile Trigger
                                    if (e.touches.length === 2) {
                                        state.keys.add('m')
                                    }

                                    const touch = e.touches[0]
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const p = state.players.get(localPlayerId)
                                    if (p) {
                                        const scale = Math.min(e.currentTarget.clientWidth / WORLD_WIDTH, e.currentTarget.clientHeight / WORLD_HEIGHT)
                                        const offsetX = (e.currentTarget.clientWidth - WORLD_WIDTH * scale) / 2
                                        const offsetY = (e.currentTarget.clientHeight - WORLD_HEIGHT * scale) / 2

                                        // Map touch to world coordinates
                                        const worldTouchX = (touch.clientX - rect.left - offsetX) / scale
                                        const worldTouchY = (touch.clientY - rect.top - offsetY) / scale

                                        p.targetX = worldTouchX
                                        p.targetY = worldTouchY - 100 // Maintain visibility offset in world units
                                    }
                                }}
                                onTouchMove={(e) => {
                                    e.preventDefault()
                                    const touch = e.touches[0]
                                    const rect = e.currentTarget.getBoundingClientRect()
                                    const p = gameRef.current.players.get(localPlayerId)
                                    if (p) {
                                        const scale = Math.min(e.currentTarget.clientWidth / WORLD_WIDTH, e.currentTarget.clientHeight / WORLD_HEIGHT)
                                        const offsetX = (e.currentTarget.clientWidth - WORLD_WIDTH * scale) / 2
                                        const offsetY = (e.currentTarget.clientHeight - WORLD_HEIGHT * scale) / 2

                                        const worldTouchX = (touch.clientX - rect.left - offsetX) / scale
                                        const worldTouchY = (touch.clientY - rect.top - offsetY) / scale

                                        p.targetX = worldTouchX
                                        p.targetY = worldTouchY - 100
                                    }
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault()
                                    gameRef.current.isTouching = false
                                }}
                            />
                        </div>
                    )}

                    {gameState === 'GAME_OVER' && (
                        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
                            <div className="text-center space-y-8">
                                <h2 className="text-6xl font-black italic tracking-tighter">COMBAT ENDED</h2>
                                <button
                                    onClick={() => startGame(true)}
                                    className="px-12 py-4 bg-cyan-500 text-black font-black rounded-xl hover:bg-cyan-400 active:scale-95 transition-all"
                                >
                                    INITIATE REMATCH
                                </button>
                                <div className="text-zinc-500 font-mono text-sm tracking-[0.3em]">RE-ESTABLISHING NEURAL LINK...</div>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
