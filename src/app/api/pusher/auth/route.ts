import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    console.log('--- Pusher Auth Hit ---')
    try {
        const text = await req.text()
        const params = new URLSearchParams(text)
        const socketId = params.get('socket_id')
        const channelName = params.get('channel_name')

        console.log('Socket ID:', socketId)
        console.log('Channel:', channelName)

        if (!socketId || !channelName) {
            console.error('Missing Pusher credentials in request')
            return new Response('Missing credentials', { status: 400 })
        }

        // For "Instant" mode, we'll use a random user ID if not authenticated
        const userId = "user-" + Math.random().toString(36).substr(2, 5)
        console.log('User ID assigned:', userId)

        const presenseData = {
            user_id: userId,
            user_info: { id: userId }
        }

        if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) {
            console.error('SERVER ERROR: PUSHER_APP_ID or PUSHER_SECRET not set in environment!')
        }

        const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenseData)
        return NextResponse.json(authResponse)
    } catch (error) {
        console.error('Pusher Auth Error:', error)
        return new Response('Unauthorized', { status: 401 })
    }
}
