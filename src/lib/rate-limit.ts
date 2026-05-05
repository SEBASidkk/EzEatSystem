const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// NOTE: In-memory only. Does not survive restarts or scale across instances.
// Replace with Redis/DB-backed store before production deployment.
export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = attempts.get(key)

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  const newCount = record.count + 1
  attempts.set(key, { ...record, count: newCount })
  return { allowed: true, remaining: MAX_ATTEMPTS - newCount }
}

export function resetRateLimit(key: string): void {
  attempts.delete(key)
}
