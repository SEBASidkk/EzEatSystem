import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function AuditPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== 'ADMIN') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Log de Auditoría</h1>
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Recurso</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">IP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{log.user.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{log.resourceType}:{log.resourceId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{log.ip}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString('es-MX')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
