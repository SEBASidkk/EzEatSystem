import Link from 'next/link'
import { Plus, KeyRound, AlertTriangle, ShieldCheck } from 'lucide-react'
import { listCredentials } from '@/actions/vault'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { VaultList } from '@/components/vault/vault-list'

export default async function VaultPage() {
  const [credentials, session] = await Promise.all([listCredentials(), auth()])
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [expiringSoon, recentAudits] = await Promise.all([
    prisma.credential.count({ where: { updatedAt: { lt: ninetyDaysAgo } } }),
    prisma.auditLog.count({
      where: { resourceType: 'Credential', timestamp: { gte: today } },
    }),
  ])

  const stats = [
    {
      label: 'Active Credentials',
      value: credentials.length,
      sub: '+3 this week',
      icon: <KeyRound size={20} className="text-slate-400" />,
    },
    {
      label: 'Expiring Soon',
      value: expiringSoon,
      sub: 'Needs rotation within 7 days',
      icon: <AlertTriangle size={20} className="text-amber-400" />,
      valueColor: expiringSoon > 0 ? '#EF4444' : '#0F172A',
    },
    {
      label: 'Recent Audits',
      value: recentAudits,
      sub: 'Access events today',
      icon: <ShieldCheck size={20} className="text-slate-400" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#2563EB' }} />
          <div>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Encrypted View</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Credential Vault</h1>
            <p className="text-sm text-slate-500">Manage and audit secure system access keys.</p>
          </div>
        </div>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#0F172A' }}
        >
          <Plus size={15} />
          Generate Key
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
              {s.icon}
            </div>
            <p className="text-3xl font-bold" style={{ color: s.valueColor ?? '#0F172A' }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <VaultList credentials={credentials} isAdmin={isAdmin} />
    </div>
  )
}
