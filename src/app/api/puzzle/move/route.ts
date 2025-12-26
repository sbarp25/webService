import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { roomId, pieceId, currentPos, senderId } = await req.json()

        await pusherServer.trigger(`room-${roomId}`, 'piece-moved', {
            pieceId,
            currentPos,
            senderId
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Pusher Trigger Error:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
