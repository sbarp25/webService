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
