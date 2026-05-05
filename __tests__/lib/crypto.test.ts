import { encrypt, decrypt } from '@/lib/crypto'

const VAULT_KEY = '0'.repeat(64) // 32 bytes hex

describe('crypto', () => {
  it('encrypts and decrypts correctly', () => {
    const plaintext = 'super-secret-password-123'
    const encrypted = encrypt(plaintext, VAULT_KEY)
    expect(encrypted.encryptedValue).toBeDefined()
    expect(encrypted.iv).toBeDefined()
    expect(encrypted.tag).toBeDefined()
    expect(encrypted.encryptedValue).not.toBe(plaintext)
    const decrypted = decrypt(encrypted, VAULT_KEY)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertext for same plaintext (unique IV)', () => {
    const plaintext = 'same-text'
    const a = encrypt(plaintext, VAULT_KEY)
    const b = encrypt(plaintext, VAULT_KEY)
    expect(a.iv).not.toBe(b.iv)
    expect(a.encryptedValue).not.toBe(b.encryptedValue)
  })

  it('throws on tampered ciphertext', () => {
    const plaintext = 'data'
    const encrypted = encrypt(plaintext, VAULT_KEY)
    const tampered = { ...encrypted, encryptedValue: 'AAAAAA' + encrypted.encryptedValue }
    expect(() => decrypt(tampered, VAULT_KEY)).toThrow()
  })

  it('handles special characters', () => {
    const plaintext = 'p@$$w0rd!#%^&*()'
    expect(decrypt(encrypt(plaintext, VAULT_KEY), VAULT_KEY)).toBe(plaintext)
  })

  it('handles long values', () => {
    const plaintext = 'x'.repeat(4000)
    expect(decrypt(encrypt(plaintext, VAULT_KEY), VAULT_KEY)).toBe(plaintext)
  })

  it('throws on invalid key length', () => {
    expect(() => encrypt('data', 'short')).toThrow('Invalid vault key')
  })
})
