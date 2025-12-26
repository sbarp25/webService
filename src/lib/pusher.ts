import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher (for triggering events)
if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) {
    console.warn('WARNING: Pusher Server credentials missing! Real-time features will fail in production.')
}

export const pusherServer = new PusherServer({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    useTLS: true,
})

// Client-side Pusher (for subscribing to events)
export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
    forceTLS: true,
    channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
    },
})
