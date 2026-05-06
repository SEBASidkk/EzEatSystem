import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined

  const [pendingTasks, myTasks, recentAudit] = await Promise.all([
    prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } } }),
    user?.id
      ? prisma.task.count({ where: { assignedToId: user.id, status: { not: 'DONE' } } })
      : Promise.resolve(0),
    user?.role === 'ADMIN'
      ? prisma.auditLog.findMany({
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ])

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Tareas pendientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{pendingTasks}</p>
          <Link href="/tasks" className="text-xs text-blue-600 mt-2 block hover:underline">Ver tareas →</Link>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Mis tareas activas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{myTasks}</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Acceso rápido</p>
          <div className="mt-2 space-y-1">
            <Link href="/vault/new" className="text-xs text-blue-600 block hover:underline">+ Nueva credencial</Link>
            <Link href="/tasks/new" className="text-xs text-blue-600 block hover:underline">+ Nueva tarea</Link>
          </div>
        </div>
      </div>
      {recentAudit.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Actividad reciente en Vault</h2>
          <div className="bg-white border rounded-lg divide-y">
            {recentAudit.map((log) => (
              <div key={log.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-700">{log.user.name} — {log.action}</span>
                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString('es-MX')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
