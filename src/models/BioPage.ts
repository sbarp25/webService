import mongoose, { Schema, model, models } from 'mongoose'

export interface ILink {
    id: string
    title: string
    url: string
    icon: string
    isActive: boolean
    order: number
    clicks: number
}

export interface ISocialLinks {
    instagram?: string
    twitter?: string
    facebook?: string
    linkedin?: string
    youtube?: string
    tiktok?: string
}

export interface IBioPage {
    _id: string
    userId: string
    qrCodeId?: string
    slug: string
    profile: {
        name: string
        bio: string
        avatar?: string
        theme: 'light' | 'dark' | 'gradient'
        accentColor: string
    }
    links: ILink[]
    socialLinks: ISocialLinks
    customization: {
        backgroundColor: string
        buttonStyle: 'rounded' | 'square' | 'pill'
        font: string
        showProfileImage: boolean
    }
    analytics: {
        totalViews: number
        totalClicks: number
    }
    createdAt: Date
    updatedAt: Date
}

const BioPageSchema = new Schema<IBioPage>({
    userId: { type: String, required: true, index: true },
    qrCodeId: String,
    slug: { type: String, required: true, unique: true, index: true },
    profile: {
        name: { type: String, required: true },
        bio: { type: String, default: '' },
        avatar: String,
        theme: { type: String, enum: ['light', 'dark', 'gradient'], default: 'light' },
        accentColor: { type: String, default: '#6366f1' }
    },
    links: [{
        id: { type: String, required: true },
        title: { type: String, required: true },
        url: { type: String, required: true },
        icon: { type: String, default: 'link' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, required: true },
        clicks: { type: Number, default: 0 }
    }],
    socialLinks: {
        instagram: String,
        twitter: String,
        facebook: String,
        linkedin: String,
        youtube: String,
        tiktok: String
    },
    customization: {
        backgroundColor: { type: String, default: '#ffffff' },
        buttonStyle: { type: String, enum: ['rounded', 'square', 'pill'], default: 'rounded' },
        font: { type: String, default: 'Inter' },
        showProfileImage: { type: Boolean, default: true }
    },
    analytics: {
        totalViews: { type: Number, default: 0 },
        totalClicks: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

BioPageSchema.pre('save', function (next) {
    this.updatedAt = new Date()
    next()
})

export const BioPage = models.BioPage || model<IBioPage>('BioPage', BioPageSchema)
