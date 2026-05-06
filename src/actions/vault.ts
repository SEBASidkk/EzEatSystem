'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { createCredentialSchema, sanitizeText } from '@/lib/validation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getVaultKey(): string {
  const key = process.env.VAULT_KEY
  if (!key || key.length !== 64) throw new Error('VAULT_KEY missing or invalid')
  return key
}

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

async function writeAuditLog(userId: string, action: string, resourceType: string, resourceId: string) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  await prisma.auditLog.create({ data: { userId, action, resourceType, resourceId, ip } })
}

export async function listCredentials() {
  const user = await requireSession()
  if (user.role === 'ADMIN') {
    return prisma.credential.findMany({
      select: { id: true, name: true, category: true, createdAt: true, updatedAt: true, userId: true },
      orderBy: { updatedAt: 'desc' },
    })
  }
  return prisma.credential.findMany({
    where: { sharedWith: { some: { id: user.id } } },
    select: { id: true, name: true, category: true, createdAt: true, updatedAt: true, userId: true },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function createCredential(formData: FormData) {
  const user = await requireSession()
  const raw = {
    name: formData.get('name') as string,
    value: formData.get('value') as string,
    category: formData.get('category') as string,
    notes: (formData.get('notes') as string) || undefined,
    sharedWith: [] as string[],
  }
  const parsed = createCredentialSchema.parse({
    ...raw,
    name: sanitizeText(raw.name),
    notes: raw.notes ? sanitizeText(raw.notes) : undefined,
  })
  const encrypted = encrypt(parsed.value, getVaultKey())
  const credential = await prisma.credential.create({
    data: {
      name: parsed.name,
      category: parsed.category,
      encryptedValue: encrypted.encryptedValue,
      iv: encrypted.iv,
      tag: encrypted.tag,
      userId: user.id,
      notes: parsed.notes,
    },
  })
  await writeAuditLog(user.id, 'CREATE_CREDENTIAL', 'Credential', credential.id)
  revalidatePath('/vault')
}

export async function revealCredential(id: string): Promise<string> {
  const user = await requireSession()
  const credential = await prisma.credential.findUnique({
    where: { id },
    include: { sharedWith: { select: { id: true } } },
  })
  if (!credential) throw new Error('Not found')
  if (user.role !== 'ADMIN' && !credential.sharedWith.some((u) => u.id === user.id)) {
    throw new Error('Forbidden')
  }
  await writeAuditLog(user.id, 'REVEAL_CREDENTIAL', 'Credential', id)
  return decrypt(
    { encryptedValue: credential.encryptedValue, iv: credential.iv, tag: credential.tag },
    getVaultKey(),
  )
}

export async function deleteCredential(id: string): Promise<{ error: string } | void> {
  try {
    const user = await requireSession()
    if (user.role !== 'ADMIN') throw new Error('Forbidden')
    await prisma.credential.delete({ where: { id } })
    await writeAuditLog(user.id, 'DELETE_CREDENTIAL', 'Credential', id)
    revalidatePath('/vault')
  } catch {
    return { error: 'No se pudo eliminar' }
  }
}

export async function shareCredential(credentialId: string, userId: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await prisma.credential.update({
    where: { id: credentialId },
    data: { sharedWith: { connect: { id: userId } } },
  })
  await writeAuditLog(user.id, 'SHARE_CREDENTIAL', 'Credential', credentialId)
  revalidatePath(`/vault/${credentialId}`)
}
