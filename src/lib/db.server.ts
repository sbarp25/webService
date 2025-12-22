import 'server-only'
import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = 'dynamic_qr'

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable')
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface CachedConnection {
    client: MongoClient | null
    db: Db | null
    promise: Promise<{ client: MongoClient; db: Db }> | null
}

let cached: CachedConnection = (global as any).mongoConnection

if (!cached) {
    cached = (global as any).mongoConnection = {
        client: null,
        db: null,
        promise: null
    }
}

/**
 * Connect to MongoDB and return the client and database instance.
 * Uses connection pooling - DO NOT close the client after use.
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
    // Check if we have a cached connection that's actually connected
    if (cached.client && cached.db) {
        try {
            // Verify the client is actually connected by pinging the database
            await cached.db.admin().ping()
            return { client: cached.client, db: cached.db }
        } catch (error) {
            // Connection was lost, clear cache
            console.log('MongoDB connection lost, reconnecting...', error)
            cached.client = null
            cached.db = null
            cached.promise = null
        }
    }

    // Return existing connection promise if one is in progress
    if (cached.promise) {
        return cached.promise
    }

    // Create new connection
    cached.promise = (async () => {
        try {
            const client = new MongoClient(MONGODB_URI, {
                maxPoolSize: 10,
                minPoolSize: 2,
            })

            await client.connect()
            const db = client.db(DB_NAME)

            cached.client = client
            cached.db = db

            console.log('MongoDB connected successfully')

            return { client, db }
        } catch (error) {
            // Clear promise on error so next call will retry
            cached.promise = null
            console.error('MongoDB connection error:', error)
            throw error
        }
    })()

    return cached.promise
}

/**
 * Get the database instance directly.
 * Convenience wrapper around connectToDatabase.
 */
export async function getDatabase(): Promise<Db> {
    const { db } = await connectToDatabase()
    return db
}
