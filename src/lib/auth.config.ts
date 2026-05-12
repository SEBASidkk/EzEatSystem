import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>
        ;(token as Record<string, unknown>).role = u.role
        ;(token as Record<string, unknown>).twoFactorEnabled = u.twoFactorEnabled
        ;(token as Record<string, unknown>).idleTimeoutMs = u.idleTimeoutMs
        ;(token as Record<string, unknown>).rememberMe = u.rememberMe
        // Without "remember me" → expire JWT in 4 hours (working session only)
        // With "remember me"    → default 24h maxAge applies
        if (u.rememberMe === false) {
          token.exp = Math.floor(Date.now() / 1000) + 4 * 60 * 60
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as Record<string, unknown>
        const u = session.user as unknown as Record<string, unknown>
        u.id = token.sub
        u.role = t.role
        u.twoFactorEnabled = t.twoFactorEnabled
        u.idleTimeoutMs = t.idleTimeoutMs
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
}
