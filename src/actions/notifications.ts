'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface Notification {
  id: string
  action: string
  resourceType: string
  timestamp: Date
  userName: string
}

const ACTION_LABEL: Record<string, string> = {
  CREATE_CREDENTIAL: 'Credencial creada',
  REVEAL_CREDENTIAL: 'Credencial revelada',
  DELETE_CREDENTIAL: 'Credencial eliminada',
  SHARE_CREDENTIAL: 'Credencial compartida',
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth()
  if (!session?.user) return []
  const logs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true } } },
  })
  return logs.map((l) => ({
    id: l.id,
    action: ACTION_LABEL[l.action] ?? l.action,
    resourceType: l.resourceType,
    timestamp: l.timestamp,
    userName: l.user.name,
  }))
}
