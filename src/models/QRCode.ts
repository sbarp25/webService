import mongoose, { Schema, model, models } from 'mongoose'

export interface IScanHistory {
    timestamp: Date
    userAgent: string
    ip: string
    location?: string
}

export interface IQRCode {
    _id: string
    userId: string
    shortCode: string
    name: string
    type: 'url' | 'vcard' | 'wifi' | 'text' | 'email' | 'biopage'
    content: any
    isActive: boolean
    scans: number
    scanHistory: IScanHistory[]
    createdAt: Date
    updatedAt: Date
}

const QRCodeSchema = new Schema<IQRCode>({
    userId: { type: String, required: true, index: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ['url', 'vcard', 'wifi', 'text', 'email', 'biopage']
    },
    content: { type: Schema.Types.Mixed, required: true },
    isActive: { type: Boolean, default: true },
    scans: { type: Number, default: 0 },
    scanHistory: [{
        timestamp: { type: Date, default: Date.now },
        userAgent: String,
        ip: String,
        location: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

// Generate unique short code before saving
QRCodeSchema.pre('save', async function (next) {
    if (!this.shortCode) {
        this.shortCode = generateShortCode()
    }
    this.updatedAt = new Date()
    next()
})

function generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export const QRCode = models.QRCode || model<IQRCode>('QRCode', QRCodeSchema)
