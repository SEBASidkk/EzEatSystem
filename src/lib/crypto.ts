import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export interface Encrypted {
  encryptedValue: string
  iv: string
  tag: string
}

export function encrypt(plaintext: string, vaultKeyHex: string): Encrypted {
  const key = Buffer.from(vaultKeyHex, 'hex')
  if (key.length !== 32) throw new Error(`Invalid vault key: expected 32 bytes, got ${key.length}`)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encryptedValue: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function decrypt(data: Encrypted, vaultKeyHex: string): string {
  const key = Buffer.from(vaultKeyHex, 'hex')
  if (key.length !== 32) throw new Error(`Invalid vault key: expected 32 bytes, got ${key.length}`)
  const iv = Buffer.from(data.iv, 'base64')
  const tag = Buffer.from(data.tag, 'base64')
  const ciphertext = Buffer.from(data.encryptedValue, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
