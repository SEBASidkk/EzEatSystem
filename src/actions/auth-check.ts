'use server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function checkCredentials(
  email: string,
  password: string,
): Promise<{ ok: boolean; needs2FA: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email, active: true },
    select: { passwordHash: true, twoFactorEnabled: true },
  })
  if (!user) return { ok: false, needs2FA: false, error: 'Credenciales inválidas' }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return { ok: false, needs2FA: false, error: 'Credenciales inválidas' }
  return { ok: true, needs2FA: user.twoFactorEnabled }
}
