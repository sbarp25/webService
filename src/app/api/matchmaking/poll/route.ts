import { getDatabase } from '@/lib/db.server'
import { NextResponse } from 'next/server'

// POST /api/matchmaking/poll
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, gender, preference } = body

        if (!userId) {
            return new Response('Missing userId', { status: 400 })
        }

        const db = await getDatabase()
        const lobby = db.collection('matchmaking_lobby')

        // 1. Check if WE have been matched by someone else
        // (In a more complex system, we might have a 'matches' collection, 
        // but for simplicity, we can just check if our status changed or look for a partner immediately)

        // Strategy: First Come First Serve
        // Look for any user who is WAITING and matches our preference

        let matchQuery: any = {
            userId: { $ne: userId }, // Not us
            status: 'WAITING'
        }

        // Apply Preference Filter
        if (preference !== 'Any') {
            matchQuery.gender = preference
        }

        // Apply Reverse Preference (They must want us)
        // If they want 'Any', we are good. If they want specific gender, we must match it.
        const reversePrefQuery = {
            $or: [
                { preference: 'Any' },
                { preference: gender }
            ]
        }

        // Combine queries
        matchQuery = { ...matchQuery, ...reversePrefQuery }

        const partner = await lobby.findOne(matchQuery)

        if (partner) {
            // Found a partner!
            // Update BOTH to 'MATCHED' to prevent others from picking them
            // In a real transactional system we'd be more careful, but for this:

            // We only lock the partner if we successfully claim them
            const claimResult = await lobby.findOneAndUpdate(
                { _id: partner._id, status: 'WAITING' },
                { $set: { status: 'MATCHED', partnerId: userId, matchedAt: new Date() } }
            )

            if (claimResult) {
                // Update ourselves too
                await lobby.updateOne(
                    { userId },
                    { $set: { status: 'MATCHED', partnerId: partner.userId, matchedAt: new Date() } }
                )

                return NextResponse.json({
                    matchFound: true,
                    partner: {
                        userId: partner.userId,
                        name: partner.name,
                        peerId: partner.peerId
                    }
                })
            }
        }

        // If no match found yet, check if someone claimed US
        const myRecord = await lobby.findOne({ userId })

        if (myRecord && myRecord.status === 'MATCHED' && myRecord.partnerId) {
            // Retrieve partner details
            const matchedPartner = await lobby.findOne({ userId: myRecord.partnerId })
            if (matchedPartner) {
                return NextResponse.json({
                    matchFound: true,
                    partner: {
                        userId: matchedPartner.userId,
                        name: matchedPartner.name,
                        peerId: matchedPartner.peerId
                    }
                })
            }
        }

        return NextResponse.json({ matchFound: false })

    } catch (e) {
        console.error('Matchmaking Poll Error:', e)
        return new Response('Internal Server Error', { status: 500 })
    }
}
