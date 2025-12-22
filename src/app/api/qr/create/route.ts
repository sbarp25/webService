import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db.server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, content } = body

    if (!name || !type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const qrCodes = db.collection('qrcodes')

    // Generate unique short code
    let shortCode = generateShortCode()
    let exists = await qrCodes.findOne({ shortCode })

    while (exists) {
      shortCode = generateShortCode()
      exists = await qrCodes.findOne({ shortCode })
    }

    const qrCode = {
      userId: session.user.id,
      shortCode,
      name,
      type,
      content,
      isActive: true,
      scans: 0,
      scanHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await qrCodes.insertOne(qrCode)

    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`

    return NextResponse.json({
      success: true,
      qrCode: {
        id: result.insertedId.toString(),
        shortCode: qrCode.shortCode,
        name: qrCode.name,
        type: qrCode.type,
        url: `${baseUrl}/qr/${qrCode.shortCode}`
      }
    })
  } catch (error) {
    console.error('Error creating QR code:', error)
    return NextResponse.json({
      error: 'Failed to create QR code',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
