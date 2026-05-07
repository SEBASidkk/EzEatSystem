import { generateSecret, generateURI, verifySync } from 'otplib'
import QRCode from 'qrcode'

export function generateTotpSecret(): string {
  return generateSecret()
}

export function generateTotpUri(secret: string, email: string): string {
  return generateURI({ issuer: 'Ez-eat Admin', label: email, secret })
}

export async function generateQrDataUrl(otpUri: string): Promise<string> {
  return QRCode.toDataURL(otpUri)
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret })
    return result.valid
  } catch {
    return false
  }
}
