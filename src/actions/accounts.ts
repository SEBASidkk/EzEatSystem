'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createUserSchema, sanitizeText } from '@/lib/validation'
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
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
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

export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('Not found')
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/accounts')
}
