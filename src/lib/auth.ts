import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string
            }
            return session
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.sub = user.id
            }
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
    },
}

export default NextAuth(authOptions)
