import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { authConfig } from '@/lib/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
})
