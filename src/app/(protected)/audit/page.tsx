import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { History, ShieldCheck } from 'lucide-react'

const ACTION_BADGE: Record<string, { cls: string; short: string }> = {
  CREATE_CREDENTIAL: { cls: 'bg-teal-50 text-teal-700',   short: 'CREATE'  },
  REVEAL_CREDENTIAL: { cls: 'bg-blue-50 text-blue-700',   short: 'REVEAL'  },
  DELETE_CREDENTIAL: { cls: 'bg-red-50 text-red-700',     short: 'DELETE'  },
  SHARE_CREDENTIAL:  { cls: 'bg-purple-50 text-purple-700', short: 'SHARE' },
}

export default async function AuditPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== 'ADMIN') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <History size={22} className="text-slate-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-500 mt-0.5">Complete trail of all system actions and access events.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg bg-green-50">
          <ShieldCheck size={14} className="text-green-600" />
          <span className="text-xs font-semibold text-green-700">Tamper-Proof Log</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">
            {logs.length} events logged
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {['User', 'Action', 'Resource', 'IP Address', 'Timestamp'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs as { id: string; action: string; resourceType: string; resourceId: string; ip: string; timestamp: Date; user: { name: string; email: string } }[]).map((log) => {
              const badge = ACTION_BADGE[log.action] ?? { cls: 'bg-slate-100 text-slate-600', short: log.action.slice(0, 6) }
              return (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900 text-xs">{log.user.name}</p>
                    <p className="text-[11px] text-slate-400">{log.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
                      {badge.short}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{log.action.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                    {log.resourceType}:{log.resourceId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{log.ip}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-400">No audit events recorded.</p>
        )}
      </div>
    </div>
  )
}
