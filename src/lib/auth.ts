import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
        const rateLimitKey = `login:${ip}`
        const { allowed } = checkRateLimit(rateLimitKey)
        if (!allowed) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, active: true },
        })

        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        resetRateLimit(rateLimitKey)
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as Record<string, unknown>).role = (user as Record<string, unknown>).role
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.sub
        ;(session.user as Record<string, unknown>).role = (token as Record<string, unknown>).role
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
})
