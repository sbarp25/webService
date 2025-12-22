import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db.server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { shortCode: string } }
) {
    try {
        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        const qrCode = await qrCodes.findOne({ shortCode: params.shortCode })

        if (!qrCode) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        if (!qrCode.isActive) {
            return NextResponse.json({ error: 'QR code is inactive' }, { status: 403 })
        }

        // Track scan
        const userAgent = request.headers.get('user-agent') || 'Unknown'
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'

        await qrCodes.updateOne(
            { _id: qrCode._id },
            {
                $inc: { scans: 1 },
                $push: {
                    scanHistory: {
                        timestamp: new Date(),
                        userAgent,
                        ip,
                        location: ''
                    }
                } as any
            }
        )

        // Handle different QR types
        switch (qrCode.type) {
            case 'url':
                return NextResponse.redirect(qrCode.content.url)

            case 'biopage':
                return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/b/${qrCode.content.slug}`)

            case 'text':
                return new NextResponse(qrCode.content.text, {
                    headers: { 'Content-Type': 'text/plain' }
                })

            default:
                return NextResponse.json({
                    type: qrCode.type,
                    content: qrCode.content
                })
        }
    } catch (error) {
        console.error('Error processing QR scan:', error)
        return NextResponse.json({
            error: 'Failed to process QR code',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
