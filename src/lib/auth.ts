import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { loginSchema } from '@/lib/validation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { authConfig } from '@/lib/auth.config'
import { verifyTotpToken } from '@/lib/totp'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
        const rateLimitKey = `login:${ip}`
        const { allowed } = await checkRateLimit(rateLimitKey)
        if (!allowed) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email, active: true },
        })
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        if (user.twoFactorEnabled && user.twoFactorSecret) {
          const code = parsed.data.totpCode ?? ''
          const totpValid = verifyTotpToken(code, user.twoFactorSecret)
          if (!totpValid) return null
        }

        await resetRateLimit(rateLimitKey)

        const setting = await prisma.systemSettings.findUnique({ where: { key: 'idle_timeout_minutes' } })
        const idleTimeoutMs = parseInt(setting?.value ?? '480') * 60 * 1000

        const rememberMe = parsed.data.rememberMe ?? true
        return { id: user.id, email: user.email, name: user.name, role: user.role, twoFactorEnabled: user.twoFactorEnabled, idleTimeoutMs, rememberMe }
      },
    }),
  ],
})
