import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { roomId, text, senderId } = await req.json()
        console.log('--- API: Chat Request ---', { roomId, text, senderId })

        const result = await pusherServer.trigger(`room-${roomId}`, 'new-message', {
            text,
            senderId,
            timestamp: new Date()
        })
        console.log('Pusher trigger result:', result)

        return NextResponse.json({ success: true, triggerStatus: result.status })
    } catch (error) {
        console.error('Pusher Chat Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
