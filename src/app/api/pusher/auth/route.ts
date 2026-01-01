import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    console.log('--- Pusher Auth Hit ---')
    try {
        const url = new URL(req.url)
        const text = await req.text()
        console.log('--- Pusher Auth: Raw Body ---', text)
        const params = new URLSearchParams(text)

        const socketId = params.get('socket_id')
        const channelName = params.get('channel_name')

        console.log('--- Pusher Auth: Parsed Body Params ---', Object.fromEntries(params.entries()))
        console.log('--- Pusher Auth: URL Search Params ---', Object.fromEntries(url.searchParams.entries()))

        if (!socketId || !channelName) {
            console.error('Missing Pusher credentials in request')
            return new Response('Missing credentials', { status: 400 })
        }

        // 1. Get the Raw User ID (which is now a Rich ID)
        const rawUserId = url.searchParams.get('x-user-id') || params.get('x-user-id') || ("user-" + Math.random().toString(36).substr(2, 5))

        // 2. Decode the Rich ID (Format: ID|Name|Gender|Pref)
        const parts = rawUserId.split('|')
        const userId = parts[0] || rawUserId
        const name = parts[1] || 'Anonymous'
        const gender = parts[2] || 'None'
        const pref = parts[3] || 'Any'

        console.log(`--- Auth Success: ${name} (${userId}) ---`)

        const presenseData = {
            user_id: userId,
            user_info: {
                id: userId,
                name,
                gender,
                pref
            }
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
