import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const [credentials, tasks, restaurants] = await Promise.all([
    prisma.credential.findMany({ select: { name: true, category: true, createdAt: true, updatedAt: true } }),
    prisma.task.findMany({ select: { title: true, status: true, priority: true, dueDate: true } }),
    prisma.restaurant.findMany({ select: { name: true, ezeatId: true, status: true } }),
  ])

  const lines: string[] = [
    'Tipo,Nombre,Estado,Categoría/Prioridad,Fecha',
    ...credentials.map((c) => `Credencial,"${c.name}",,"${c.category}","${c.createdAt.toISOString()}"`),
    ...tasks.map((t) => `Tarea,"${t.title}","${t.status}","${t.priority}","${t.dueDate?.toISOString() ?? ''}"`),
    ...restaurants.map((r) => `Negocio,"${r.name}","${r.status}",,`),
  ]

  const csv = lines.join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ezeat-reporte-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
