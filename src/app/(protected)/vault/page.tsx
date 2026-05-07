import Link from 'next/link'
import { Plus, KeyRound, RotateCcw, ShieldCheck } from 'lucide-react'
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

  const [porRotar, auditasHoy] = await Promise.all([
    prisma.credential.count({ where: { updatedAt: { lt: ninetyDaysAgo } } }),
    prisma.auditLog.count({
      where: { resourceType: 'Credential', timestamp: { gte: today } },
    }),
  ])

  const stats = [
    {
      label: 'Credenciales activas',
      value: credentials.length,
      sub: 'En el sistema',
      icon: <KeyRound size={20} className="text-slate-400" />,
    },
    {
      label: 'Rotación pendiente',
      value: porRotar,
      sub: porRotar > 0 ? 'Sin actualizar hace +90 días' : 'Todo al día',
      icon: <RotateCcw size={20} className={porRotar > 0 ? 'text-amber-400' : 'text-slate-400'} />,
      valueColor: porRotar > 0 ? '#EF4444' : '#0F172A',
    },
    {
      label: 'Auditorías hoy',
      value: auditasHoy,
      sub: 'Eventos de acceso',
      icon: <ShieldCheck size={20} className="text-slate-400" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-slate-900" />
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">AES-256-GCM</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Bóveda de Credenciales</h1>
            <p className="text-sm text-slate-500">Gestión segura de claves y accesos del sistema.</p>
          </div>
        </div>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors"
        >
          <Plus size={15} />
          Nueva credencial
        </Link>
      </div>

      {/* Alerta de política — rotación de contraseñas */}
      {porRotar > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <RotateCcw size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Alerta de Política — Rotación de Contraseñas
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {porRotar} {porRotar === 1 ? 'credencial lleva' : 'credenciales llevan'} más de 90 días sin actualizarse.
              Rota las claves marcadas como <span className="font-semibold">Alerta Admin</span> cuanto antes.
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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
