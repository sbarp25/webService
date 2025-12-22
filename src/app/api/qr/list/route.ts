import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db.server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        const qrCodesList = await qrCodes
            .find({ userId: session.user.id })
            .sort({ createdAt: -1 })
            .toArray()

        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

        return NextResponse.json({
            success: true,
            qrCodes: qrCodesList.map(qr => ({
                id: qr._id.toString(),
                shortCode: qr.shortCode,
                name: qr.name,
                type: qr.type,
                content: qr.content,
                isActive: qr.isActive,
                scans: qr.scans,
                createdAt: qr.createdAt,
                url: `${baseUrl}/qr/${qr.shortCode}`
            }))
        })
    } catch (error) {
        console.error('Error fetching QR codes:', error)
        return NextResponse.json({
            error: 'Failed to fetch QR codes',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
