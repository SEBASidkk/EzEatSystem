'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createUserSchema, updateUserSchema, systemSettingSchema, sanitizeText } from '@/lib/validation'
import { generateTotpSecret, generateTotpUri, generateQrDataUrl, verifyTotpToken } from '@/lib/totp'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  const user = session?.user as { id: string; role: string } | undefined
  if (!session || user?.role !== 'ADMIN') throw new Error('Forbidden')
  return user
}

export async function listUsers() {
  await requireAdmin()
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, twoFactorEnabled: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createUser(formData: FormData) {
  await requireAdmin()
  const parsed = createUserSchema.parse({
    email: formData.get('email') as string,
    name: sanitizeText(formData.get('name') as string),
    role: formData.get('role') as string,
    password: formData.get('password') as string,
  })
  const passwordHash = await bcrypt.hash(parsed.password, 12)
  await prisma.user.create({
    data: { email: parsed.email, name: parsed.name, role: parsed.role, passwordHash },
  })
  revalidatePath('/accounts')
}

export async function updateUser(userId: string, formData: FormData) {
  await requireAdmin()
  const parsed = updateUserSchema.parse({
    name: formData.get('name') ? sanitizeText(formData.get('name') as string) : undefined,
    email: (formData.get('email') as string) || undefined,
    role: (formData.get('role') as string) || undefined,
  })
  await prisma.user.update({ where: { id: userId }, data: parsed })
  revalidatePath('/accounts')
}

export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/accounts')
}

export async function setup2FA(userId: string): Promise<{ qrDataUrl: string; secret: string }> {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  const secret = generateTotpSecret()
  const uri = generateTotpUri(secret, user.email)
  const qrDataUrl = await generateQrDataUrl(uri)
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret, twoFactorEnabled: false } })
  return { qrDataUrl, secret }
}

export async function confirm2FA(userId: string, token: string): Promise<{ success: boolean }> {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.twoFactorSecret) return { success: false }
  const valid = verifyTotpToken(token, user.twoFactorSecret)
  if (!valid) return { success: false }
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } })
  revalidatePath('/accounts')
  return { success: true }
}

export async function disable2FA(userId: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } })
  revalidatePath('/accounts')
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  await requireAdmin()
  const settings = await prisma.systemSettings.findMany()
  return Object.fromEntries(settings.map((s) => [s.key, s.value]))
}

export async function updateSystemSetting(key: string, value: string) {
  await requireAdmin()
  systemSettingSchema.parse({ key, value })
  await prisma.systemSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  revalidatePath('/accounts')
}
