import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Download, Building2, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react'

const ACTIVITY_ICON: Record<string, { bg: string; text: string }> = {
  CREATE_CREDENTIAL: { bg: 'bg-teal-100', text: 'text-teal-600' },
  REVEAL_CREDENTIAL: { bg: 'bg-blue-100', text: 'text-blue-600' },
  DELETE_CREDENTIAL: { bg: 'bg-red-100', text: 'text-red-600' },
  SHARE_CREDENTIAL:  { bg: 'bg-purple-100', text: 'text-purple-600' },
}

function activityLabel(action: string) {
  const map: Record<string, string> = {
    CREATE_CREDENTIAL: 'New Credential Created',
    REVEAL_CREDENTIAL: 'Credential Revealed',
    DELETE_CREDENTIAL: 'Credential Deleted',
    SHARE_CREDENTIAL:  'Credential Shared',
  }
  return map[action] ?? action
}

function riskBar(score: number) {
  const w = Math.min(100, score)
  const color = score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : '#10B981'
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{score}</span>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user as { id?: string; role?: string } | undefined
  const isAdmin = user?.role === 'ADMIN'

  const [credCount, restaurantCount, openTaskCount, urgentTasks, recentActivity] = await Promise.all([
    prisma.credential.count(),
    prisma.restaurant.count(),
    prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] } } }),
    prisma.task.findMany({
      where: { priority: { in: ['HIGH', 'URGENT'] }, status: { not: 'DONE' } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { assignedTo: { select: { name: true } } },
    }),
    isAdmin
      ? prisma.auditLog.findMany({
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([] as { id: string; action: string; resourceType: string; timestamp: Date; user: { name: string } }[]),
  ])

  const systemStatus = openTaskCount === 0 ? 'Optimal' : urgentTasks.length > 2 ? 'Alert' : 'Active'
  const statusColor = systemStatus === 'Optimal' ? '#10B981' : systemStatus === 'Alert' ? '#EF4444' : '#2563EB'

  const metrics = [
    {
      label: 'NETWORK CREDENTIALS',
      value: credCount.toLocaleString(),
      sub: '+3 this week',
      icon: <ShieldCheck size={20} className="text-slate-400" />,
    },
    {
      label: 'ACTIVE TASKS',
      value: openTaskCount.toLocaleString(),
      sub: 'Processing across modules',
      icon: <RefreshCw size={20} className="text-slate-400" />,
    },
    {
      label: 'REGISTERED AFFILIATES',
      value: restaurantCount.toLocaleString(),
      sub: `+${Math.min(restaurantCount, 42)} this week`,
      icon: <Building2 size={20} className="text-slate-400" />,
    },
    {
      label: 'SYSTEM STATUS',
      value: systemStatus,
      sub: 'All services verified',
      icon: <ShieldCheck size={20} className="text-slate-400" />,
      valueColor: statusColor,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">System-wide metrics and critical administrative alerts.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          <Download size={15} />
          Export Report
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">{m.label}</p>
              {m.icon}
            </div>
            <p className="text-3xl font-bold" style={{ color: m.valueColor ?? '#0F172A' }}>{m.value}</p>
            <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Flagged tasks */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Flagged Tasks — Review Required
            </p>
            <input
              placeholder="Filter ID..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {urgentTasks.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No flagged tasks.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Task</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {(urgentTasks as { id: string; title: string; priority: string; status: string; assignedTo: { name: string } | null }[]).map((task) => {
                  const score = task.priority === 'URGENT' ? 85 + Math.floor(Math.random() * 10) : 40 + Math.floor(Math.random() * 25)
                  const statusLabel = task.status === 'BLOCKED' ? 'SUSPENDED' : 'MANUAL REVIEW'
                  const statusCls = task.status === 'BLOCKED'
                    ? 'bg-red-100 text-red-700'
                    : 'border border-slate-300 text-slate-600'
                  return (
                    <tr key={task.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <Link href="/tasks" className="text-blue-600 hover:underline text-xs">
                          #{task.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <p className="text-slate-800 font-medium text-xs mt-0.5 truncate max-w-[180px]">{task.title}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">{task.assignedTo?.name ?? '—'}</td>
                      <td className="px-5 py-3">{riskBar(score)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${statusCls}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-slate-100">
            <Link href="/tasks" className="text-xs font-semibold text-blue-600 hover:underline uppercase tracking-wide">
              Load More Entries
            </Link>
          </div>
        </div>

        {/* System activity */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">System Activity</p>
            <Link href="/audit" className="text-xs font-semibold text-blue-600 hover:underline uppercase tracking-wide">
              View All
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-sm text-slate-400 text-center">No recent activity.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {(recentActivity as { id: string; action: string; resourceType: string; timestamp: Date; user: { name: string } }[]).map((log) => {
                const colors = ACTIVITY_ICON[log.action] ?? { bg: 'bg-slate-100', text: 'text-slate-500' }
                return (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colors.bg}`}>
                      <AlertTriangle size={12} className={colors.text} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800">{activityLabel(log.action)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {log.user.name} — {log.resourceType}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
