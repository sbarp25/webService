import { getDatabase } from '@/lib/db.server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { socketId, userId, name, gender, pref } = body

        if (!socketId) {
            return NextResponse.json({ error: 'Missing socketId' }, { status: 400 })
        }

        const db = await getDatabase()
        const collection = db.collection('puzzle_profiles')

        // Save or update profile indexed by socketId
        // We use an upsert to handle potential re-registration
        await collection.updateOne(
            { socketId },
            {
                $set: {
                    userId,
                    name,
                    gender,
                    pref,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        )

        console.log(`--- Profile Registered: ${name} (${socketId}) ---`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving puzzle profile:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
