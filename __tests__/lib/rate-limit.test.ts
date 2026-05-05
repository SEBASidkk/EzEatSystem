import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit('test-key')
  })

  it('allows first 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit('test-key')
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks 6th attempt', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('test-key')
    const result = checkRateLimit('test-key')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after resetRateLimit', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('test-key')
    resetRateLimit('test-key')
    const result = checkRateLimit('test-key')
    expect(result.allowed).toBe(true)
  })

  it('tracks different keys independently', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('key-a')
    const resultA = checkRateLimit('key-a')
    const resultB = checkRateLimit('key-b')
    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true)
  })
})
