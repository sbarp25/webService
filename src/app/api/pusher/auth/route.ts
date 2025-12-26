import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.formData()
        const socketId = body.get('socket_id') as string
        const channelName = body.get('channel_name') as string

        // For "Instant" mode, we'll use a random user ID if not authenticated
        const userId = "user-" + Math.random().toString(36).substr(2, 5)

        const presenseData = {
            user_id: userId,
            user_info: { id: userId }
        }

        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenseData)
        return NextResponse.json(authResponse)
    } catch (error) {
        console.error('Pusher Auth Error:', error)
        return new Response('Unauthorized', { status: 401 })
    }
}
