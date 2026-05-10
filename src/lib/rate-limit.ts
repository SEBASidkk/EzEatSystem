import { prisma } from './db'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  const now = new Date()
  const resetAt = new Date(Date.now() + WINDOW_MS)

  const record = await prisma.rateLimit.findUnique({ where: { key } })

  if (!record || record.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    })
    return { allowed: true }
  }

  if (record.count >= MAX_ATTEMPTS) return { allowed: false }

  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return { allowed: true }
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.delete({ where: { key } }).catch(() => null)
}
