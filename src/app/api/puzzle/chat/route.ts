import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { roomId, message, senderId } = await req.json()

        await pusherServer.trigger(`room-${roomId}`, 'new-message', {
            text: message,
            senderId,
            timestamp: new Date()
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Pusher Chat Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
