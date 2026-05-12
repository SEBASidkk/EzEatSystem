import { prisma } from '@/lib/db'
import { BarChart2, TrendingUp, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Module {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

function overallProgress(modules: Module[]) {
  if (!modules.length) return 0
  return Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)
}

function fmt(d: Date) {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const dynamic = 'force-dynamic'

export default async function ProyectosAnalyticsPage() {
  const projects = await prisma.clientProject.findMany({ orderBy: { createdAt: 'desc' } })

  const enriched = projects.map(p => {
    const modules  = p.modules as unknown as Module[]
    const progress = overallProgress(modules)
    const now      = Date.now()
    const daysLeft = Math.ceil((p.estimatedEnd.getTime() - now) / 86_400_000)
    const isActive = p.active
    const isOverdue = daysLeft < 0 && isActive && progress < 100
    const done   = modules.filter(m => m.status === 'completado').length
    const inProg = modules.filter(m => m.status === 'en_progreso').length
    return { ...p, modules, progress, daysLeft, isOverdue, done, inProg }
  })

  const total     = enriched.length
  const active    = enriched.filter(p => p.active).length
  const overdue   = enriched.filter(p => p.isOverdue).length
  const avgProgress = total ? Math.round(enriched.reduce((s, p) => s + p.progress, 0) / total) : 0
  const allModules  = enriched.flatMap(p => p.modules)
  const completedM  = allModules.filter(m => m.status === 'completado').length
  const totalM      = allModules.length

  const upcoming = enriched
    .filter(p => p.active && p.daysLeft >= 0 && p.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const overdueList = enriched.filter(p => p.isOverdue)

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/proyectos"
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analíticas de Portales</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vista consolidada de todos los proyectos activos</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total portales', val: total, icon: BarChart2, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Portales activos', val: active, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Avance promedio', val: `${avgProgress}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Con retraso', val: overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`bg-white border ${k.border} rounded-2xl p-5 shadow-sm`}>
              <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={k.color} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.label}</p>
            </div>
          )
        })}
      </div>

      {/* Module stats */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-5">Módulos — visión global</p>
        <div className="grid grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Completados', val: completedM, pct: totalM ? Math.round(completedM / totalM * 100) : 0, color: '#10B981', bg: '#ECFDF5' },
            { label: 'En progreso', val: allModules.filter(m => m.status === 'en_progreso').length, pct: totalM ? Math.round(allModules.filter(m => m.status === 'en_progreso').length / totalM * 100) : 0, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Pendientes',  val: allModules.filter(m => m.status === 'pendiente').length, pct: totalM ? Math.round(allModules.filter(m => m.status === 'pendiente').length / totalM * 100) : 0, color: '#94A3B8', bg: '#F8FAFC' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-slate-900">{s.val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
              <p className="text-[10px] mt-1 font-semibold" style={{ color: s.color }}>{s.pct}%</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center">{totalM} módulos totales en {total} proyectos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Progress per project */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-5">Avance por portal</p>
          {enriched.length === 0 ? (
            <p className="text-sm text-slate-400">Sin portales.</p>
          ) : (
            <div className="space-y-3">
              {enriched.sort((a, b) => b.progress - a.progress).map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <Link href={`/proyectos/${p.id}`} className="font-medium text-slate-700 hover:text-blue-600 truncate transition-colors">
                        {p.projectName}
                      </Link>
                    </div>
                    <span className="font-bold tabular-nums shrink-0 ml-2"
                      style={{ color: p.progress >= 80 ? '#10B981' : p.progress >= 40 ? '#3B82F6' : '#64748B' }}>
                      {p.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.progress}%`,
                        backgroundColor: p.progress >= 80 ? '#10B981' : p.progress >= 40 ? '#3B82F6' : '#0F172A',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming deliveries */}
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={13} className="text-blue-500" /> Entregas próximas (30d)
            </p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400">Sin entregas en los próximos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <Link href={`/proyectos/${p.id}`} className="text-sm font-medium text-slate-700 hover:text-blue-600 truncate block transition-colors">
                        {p.projectName}
                      </Link>
                      <p className="text-xs text-slate-400">{p.clientName} · {fmt(p.estimatedEnd)}</p>
                    </div>
                    <span className={`shrink-0 ml-3 text-xs font-bold px-2.5 py-1 rounded-full ${
                      p.daysLeft <= 7 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {p.daysLeft === 0 ? 'Hoy' : `${p.daysLeft}d`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue */}
          {overdueList.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={13} /> Con retraso
              </p>
              <div className="space-y-2">
                {overdueList.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
                    <div className="min-w-0">
                      <Link href={`/proyectos/${p.id}`} className="text-sm font-medium text-red-800 hover:text-red-600 truncate block transition-colors">
                        {p.projectName}
                      </Link>
                      <p className="text-xs text-red-400">{p.clientName} · venció {fmt(p.estimatedEnd)}</p>
                    </div>
                    <span className="shrink-0 ml-3 text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                      +{Math.abs(p.daysLeft)}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
