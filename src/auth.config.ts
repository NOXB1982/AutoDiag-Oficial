import type { DefaultSession, NextAuthConfig } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
        } & DefaultSession["user"]
    }

    interface User {
        role?: string
    }
}

export const authConfig = {
    providers: [],
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET || "3c86ba47bd35a4d6bb95aa2e89647ab2891398bb279b940026e95c1a79f8fa55",
    trustHost: true,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnLogin = nextUrl.pathname.startsWith('/login')

            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            if (!isLoggedIn) {
                return false
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = (user as any).role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
            }
            return session
        },
    },
    session: { strategy: "jwt" }
} satisfies NextAuthConfig
