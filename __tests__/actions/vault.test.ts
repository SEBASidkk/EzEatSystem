import { encrypt, decrypt } from '@/lib/crypto'

const VAULT_KEY = '0'.repeat(64)

describe('vault crypto round-trip', () => {
  it('stores and retrieves credential value', () => {
    const value = 'sk_live_stripe_key_123456'
    const encrypted = encrypt(value, VAULT_KEY)
    const decrypted = decrypt(encrypted, VAULT_KEY)
    expect(decrypted).toBe(value)
  })

  it('handles special characters', () => {
    const value = 'p@$$w0rd!#%^&*()'
    const encrypted = encrypt(value, VAULT_KEY)
    expect(decrypt(encrypted, VAULT_KEY)).toBe(value)
  })
})
