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
