import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { roomId, senderId } = await req.json()

        await pusherServer.trigger(`room-${roomId}`, 'puzzle-completed', {
            senderId
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Pusher Complete Trigger Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
