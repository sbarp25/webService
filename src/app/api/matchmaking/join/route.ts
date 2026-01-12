import { getDatabase } from '@/lib/db.server'
import { NextResponse } from 'next/server'

// POST /api/matchmaking/join
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, name, gender, preference, peerId } = body

        if (!userId || !peerId || !name) {
            return new Response('Missing required fields', { status: 400 })
        }

        const db = await getDatabase()
        const lobby = db.collection('matchmaking_lobby')

        // Remove any existing entry for this user
        await lobby.deleteOne({ userId })

        // Add user to lobby
        // We add a timestamp to cleanup old users later if needed
        await lobby.insertOne({
            userId,
            name,
            gender,
            preference,
            peerId,
            status: 'WAITING',
            joinedAt: new Date()
        })

        return NextResponse.json({ success: true, message: 'Joined lobby' })
    } catch (e) {
        console.error('Matchmaking Join Error:', e)
        return new Response('Internal Server Error', { status: 500 })
    }
}
