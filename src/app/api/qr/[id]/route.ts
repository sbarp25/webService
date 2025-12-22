import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db.server'
import { ObjectId } from 'mongodb'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET - Fetch single QR code
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        const qrCode = await qrCodes.findOne({
            _id: new ObjectId(id),
            userId: session.user.id
        })

        if (!qrCode) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

        return NextResponse.json({
            success: true,
            qrCode: {
                id: qrCode._id.toString(),
                shortCode: qrCode.shortCode,
                name: qrCode.name,
                type: qrCode.type,
                content: qrCode.content,
                isActive: qrCode.isActive,
                scans: qrCode.scans,
                scanHistory: qrCode.scanHistory || [],
                createdAt: qrCode.createdAt,
                updatedAt: qrCode.updatedAt,
                url: `${baseUrl}/qr/${qrCode.shortCode}`
            }
        })
    } catch (error) {
        console.error('Error fetching QR code:', error)
        return NextResponse.json({
            error: 'Failed to fetch QR code',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// PUT - Update QR code
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, content, isActive } = body

        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        // Verify ownership
        const existingQR = await qrCodes.findOne({
            _id: new ObjectId(id),
            userId: session.user.id
        })

        if (!existingQR) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        // Update QR code
        const updateData: any = {
            updatedAt: new Date()
        }

        if (name !== undefined) updateData.name = name
        if (content !== undefined) updateData.content = content
        if (isActive !== undefined) updateData.isActive = isActive

        await qrCodes.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        )

        const updatedQR = await qrCodes.findOne({ _id: new ObjectId(id) })

        const headersList = await headers()
        const host = headersList.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

        return NextResponse.json({
            success: true,
            qrCode: {
                id: updatedQR!._id.toString(),
                shortCode: updatedQR!.shortCode,
                name: updatedQR!.name,
                type: updatedQR!.type,
                content: updatedQR!.content,
                isActive: updatedQR!.isActive,
                scans: updatedQR!.scans,
                createdAt: updatedQR!.createdAt, // Assuming this exists or needed
                updatedAt: updatedQR!.updatedAt,
                url: `${baseUrl}/qr/${updatedQR!.shortCode}`
            }
        })
    } catch (error) {
        console.error('Error updating QR code:', error)
        return NextResponse.json({
            error: 'Failed to update QR code',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// DELETE - Delete QR code
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { db } = await connectToDatabase()
        const qrCodes = db.collection('qrcodes')

        // Verify ownership
        const existingQR = await qrCodes.findOne({
            _id: new ObjectId(id),
            userId: session.user.id
        })

        if (!existingQR) {
            return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
        }

        // Hard delete
        await qrCodes.deleteOne({ _id: new ObjectId(id) })

        return NextResponse.json({
            success: true,
            message: 'QR code deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting QR code:', error)
        return NextResponse.json({
            error: 'Failed to delete QR code',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
