'use server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

async function requireSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user as { id: string; role: string }
}

export interface ProjectModule {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

export interface ProjectUpdate {
  date: string
  message: string
}

export interface ProjectContact {
  name: string
  email?: string
  phone?: string
  role?: string
}

export interface ProjectCommunication {
  type: 'whatsapp' | 'email' | 'phone' | 'slack' | 'meet' | 'teams' | 'other'
  label: string
  value: string
}

export interface ProjectComment {
  id: string
  moduleIndex: number
  authorName: string
  message: string
  date: string
}

export interface ProjectApproval {
  moduleIndex: number
  status: 'approved' | 'rejected'
  note?: string
  date: string
  authorName: string
}

export interface GanttTask {
  id: string
  name: string
  /** Planned (ideal) start date — YYYY-MM-DD */
  start: string
  /** Planned (ideal) end date — YYYY-MM-DD */
  end: string
  /** Actual start date — YYYY-MM-DD (real execution) */
  actualStart?: string
  /** Actual end date — YYYY-MM-DD (real execution) */
  actualEnd?: string
  /** 0–100 completion percentage */
  progress: number
  color: string
  status: 'no_iniciado' | 'en_progreso' | 'completado' | 'bloqueado'
  priority?: 'baja' | 'media' | 'alta' | 'critica'
  assignee?: string
  milestone?: boolean
  notes?: string
}

export async function listClientProjects() {
  await requireSession()
  return prisma.clientProject.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function getClientProject(id: string) {
  await requireSession()
  return prisma.clientProject.findUnique({ where: { id } })
}

export async function createClientProject(data: {
  accessCode: string
  clientName: string
  projectName: string
  startDate: string
  estimatedEnd: string
  modules: ProjectModule[]
  updates: ProjectUpdate[]
  gantt: GanttTask[]
  contacts?: ProjectContact[]
  communications?: ProjectCommunication[]
}) {
  await requireSession()
  await prisma.clientProject.create({
    data: {
      accessCode:     data.accessCode.trim(),
      clientName:     data.clientName.trim(),
      projectName:    data.projectName.trim(),
      startDate:      new Date(data.startDate),
      estimatedEnd:   new Date(data.estimatedEnd),
      modules:        data.modules        as unknown as never,
      updates:        data.updates        as unknown as never,
      gantt:          data.gantt          as unknown as never,
      contacts:       (data.contacts       ?? []) as unknown as never,
      communications: (data.communications ?? []) as unknown as never,
    },
  })
  revalidatePath('/proyectos')
}

export async function updateClientProject(id: string, data: {
  clientName: string
  projectName: string
  startDate: string
  estimatedEnd: string
  modules: ProjectModule[]
  updates: ProjectUpdate[]
  gantt: GanttTask[]
  active: boolean
  contacts?: ProjectContact[]
  communications?: ProjectCommunication[]
}) {
  await requireSession()
  await prisma.clientProject.update({
    where: { id },
    data: {
      clientName:     data.clientName.trim(),
      projectName:    data.projectName.trim(),
      startDate:      new Date(data.startDate),
      estimatedEnd:   new Date(data.estimatedEnd),
      modules:        data.modules        as unknown as never,
      updates:        data.updates        as unknown as never,
      gantt:          data.gantt          as unknown as never,
      active:         data.active,
      contacts:       (data.contacts       ?? []) as unknown as never,
      communications: (data.communications ?? []) as unknown as never,
    },
  })
  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
}

export async function deleteClientProject(id: string) {
  await requireSession()
  await prisma.clientProject.delete({ where: { id } })
  revalidatePath('/proyectos')
}
