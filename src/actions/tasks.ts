'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createTaskSchema, updateTaskSchema, sanitizeText } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

export async function listTasks() {
  await requireSession()
  return prisma.task.findMany({
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createTask(formData: FormData) {
  const user = await requireSession()
  const parsed = createTaskSchema.parse({
    title: sanitizeText(formData.get('title') as string),
    description: formData.get('description') ? sanitizeText(formData.get('description') as string) : undefined,
    priority: formData.get('priority') || 'MEDIUM',
    status: 'TODO',
    assignedToId: (formData.get('assignedToId') as string) || undefined,
    tags: [],
  })
  await prisma.task.create({ data: { ...parsed, createdById: user.id } })
  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: string, status: string) {
  await requireSession()
  const parsed = updateTaskSchema.parse({ status })
  await prisma.task.update({ where: { id: taskId }, data: parsed })
  revalidatePath('/tasks')
}

export async function deleteTask(taskId: string) {
  const user = await requireSession()
  if (user.role !== 'ADMIN') throw new Error('Forbidden')
  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath('/tasks')
}

export async function updateTask(taskId: string, formData: FormData) {
  await requireSession()
  const rawDueDate = formData.get('dueDate') as string | null
  const raw = {
    title: (formData.get('title') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
    priority: (formData.get('priority') as string) || undefined,
    assignedToId: (formData.get('assignedToId') as string) || undefined,
    dueDate: rawDueDate || undefined,
  }
  const parsed = updateTaskSchema.parse({
    ...raw,
    title: raw.title ? sanitizeText(raw.title) : undefined,
    description: raw.description ? sanitizeText(raw.description) : undefined,
    dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString() : undefined,
  })
  await prisma.task.update({ where: { id: taskId }, data: parsed })
  revalidatePath('/tasks')
}
