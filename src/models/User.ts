import mongoose, { Schema, model, models } from 'mongoose'

export interface IUser {
    _id: string
    email: string
    name: string
    image?: string
    googleId: string
    createdAt: Date
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: String,
    googleId: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
})

export const User = models.User || model<IUser>('User', UserSchema)
