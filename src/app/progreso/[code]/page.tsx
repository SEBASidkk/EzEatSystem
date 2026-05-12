import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, Circle, CalendarDays, Zap, Utensils, TrendingUp, MessageSquare } from 'lucide-react'
import { GanttChart } from '@/components/proyectos/gantt-chart'
import type { GanttTask } from '@/actions/client-projects'

// ─── types ────────────────────────────────────────────────────────────────────

interface Module {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

interface Update {
  date: string
  message: string
}

// ─── config ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  completado:  {
    label: 'Completado',
    Icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: '#10B981',
    dot: '#10B981',
  },
  en_progreso: {
    label: 'En progreso',
    Icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    bar: '#3B82F6',
    dot: '#3B82F6',
  },
  pendiente: {
    label: 'Pendiente',
    Icon: Circle,
    color: 'text-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    bar: '#CBD5E1',
    dot: '#CBD5E1',
  },
} satisfies Record<string, { label: string; Icon: React.ElementType; color: string; bg: string; border: string; bar: string; dot: string }>

// ─── helpers ──────────────────────────────────────────────────────────────────

function overallProgress(modules: Module[]) {
  if (!modules.length) return 0
  return Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length)
}

function fmt(date: string | Date) {
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtShort(date: string | Date) {
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function daysLeft(date: Date) {
  const diff = Math.ceil((date.getTime() - Date.now()) / 86_400_000)
  return diff
}

// ─── circular progress ring ───────────────────────────────────────────────────
function ProgressRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - pct / 100)
  const color = pct >= 80 ? '#10B981' : pct >= 40 ? '#3B82F6' : '#0F172A'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ProgresoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const project = await prisma.clientProject.findUnique({ where: { accessCode: code } })
  if (!project || !project.active) notFound()

  const modules = project.modules as unknown as Module[]
  const updates = project.updates as unknown as Update[]
  const gantt   = (project.gantt ?? []) as unknown as GanttTask[]
  const overall = overallProgress(modules)

  const done    = modules.filter(m => m.status === 'completado').length
  const inProg  = modules.filter(m => m.status === 'en_progreso').length
  const pending = modules.filter(m => m.status === 'pendiente').length

  const remaining = daysLeft(project.estimatedEnd)
  const isOverdue = remaining < 0
  const isSoon    = remaining >= 0 && remaining <= 7

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top nav bar ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <Utensils size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Ez-eat</span>
            <span className="text-slate-200 text-lg font-light">/</span>
            <span className="text-sm text-slate-500 truncate max-w-[200px]">{project.projectName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: overall >= 80 ? '#ECFDF5' : overall >= 40 ? '#EFF6FF' : '#F8FAFC',
                color: overall >= 80 ? '#059669' : overall >= 40 ? '#2563EB' : '#64748B',
              }}
            >
              {overall}% completado
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">

            {/* Progress ring */}
            <div className="relative shrink-0">
              <ProgressRing pct={overall} size={128} stroke={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: overall >= 80 ? '#059669' : overall >= 40 ? '#2563EB' : '#0F172A' }}
                >
                  {overall}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">avance</span>
              </div>
            </div>

            {/* Project info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Portal de progreso</p>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{project.projectName}</h1>
              <p className="text-lg text-slate-500 mt-0.5">{project.clientName}</p>

              {/* Date strip */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays size={13} className="text-slate-400" />
                  <span>Inicio: <strong className="text-slate-700">{fmt(project.startDate)}</strong></span>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                  isOverdue ? 'bg-red-50 text-red-600' : isSoon ? 'bg-amber-50 text-amber-700' : 'text-slate-500'
                }`}>
                  <Clock size={13} />
                  {isOverdue
                    ? `${Math.abs(remaining)}d de retraso`
                    : isSoon
                    ? `${remaining}d para entrega`
                    : `Entrega: ${fmt(project.estimatedEnd)}`}
                </div>
              </div>
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              {[
                { label: 'Listos',      val: done,   color: '#10B981', bg: '#ECFDF5' },
                { label: 'En progreso', val: inProg,  color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Pendientes',  val: pending, color: '#94A3B8', bg: '#F8FAFC' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: s.bg }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-semibold tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-xs" style={{ color: s.color + 'CC' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Master progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progreso general</span>
              <span className="font-semibold text-slate-600">{overall}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${overall}%`,
                  backgroundColor: overall >= 80 ? '#10B981' : overall >= 40 ? '#3B82F6' : '#0F172A',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Modules (2 cols) ──────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Módulos del sistema</h2>
              <span className="ml-auto text-xs text-slate-400">{modules.length} módulo{modules.length !== 1 ? 's' : ''}</span>
            </div>

            {modules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Circle size={28} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Sin módulos registrados aún.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, i) => {
                  const cfg = STATUS_CFG[mod.status] ?? STATUS_CFG.pendiente
                  const Icon = cfg.Icon
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-2xl border ${cfg.border} p-5 shadow-sm transition-shadow hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <Icon size={15} className={cfg.color} />
                          </div>
                          <span className="font-semibold text-slate-800 text-sm truncate">{mod.name}</span>
                        </div>
                        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Avance</span>
                          <span className="font-semibold tabular-nums" style={{ color: cfg.bar }}>{mod.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${mod.progress}%`, backgroundColor: cfg.bar }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Updates feed ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Actualizaciones</h2>
            </div>

            {updates.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <MessageSquare size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Sin actualizaciones aún.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-100" />

                <div className="space-y-1">
                  {[...updates].reverse().map((u, i) => (
                    <div key={i} className="relative pl-10">
                      {/* Dot */}
                      <div className={`absolute left-2 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />

                      <div className={`bg-white border rounded-2xl p-4 mb-3 shadow-sm ${i === 0 ? 'border-blue-100' : 'border-slate-100'}`}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                          {fmtShort(u.date)}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{u.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery countdown card */}
            <div className={`mt-4 rounded-2xl p-4 border ${
              isOverdue ? 'bg-red-50 border-red-200' : isSoon ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${
                isOverdue ? 'text-red-600' : isSoon ? 'text-amber-700' : 'text-slate-500'
              }`}>
                {isOverdue ? 'Retraso' : 'Fecha de entrega estimada'}
              </p>
              <p className={`text-sm font-semibold ${
                isOverdue ? 'text-red-700' : isSoon ? 'text-amber-800' : 'text-slate-700'
              }`}>
                {fmt(project.estimatedEnd)}
              </p>
              {!isOverdue && (
                <p className={`text-xs mt-0.5 ${isSoon ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {remaining === 0 ? 'Es hoy' : `${remaining} día${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`}
                </p>
              )}
              {isOverdue && (
                <p className="text-xs text-red-500 mt-0.5">{Math.abs(remaining)} días de retraso</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Gantt timeline ───────────────────────────────────────────── */}
        {gantt.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays size={16} className="text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Línea de tiempo</h2>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <GanttChart tasks={gantt} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white mt-10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <Utensils size={12} className="text-white" />
            </div>
            <span className="text-xs text-slate-400">Powered by <strong className="text-slate-600">Ez-eat System</strong></span>
          </div>
          <p className="text-[10px] text-slate-300 font-mono">Código de acceso: {code}</p>
        </div>
      </footer>
    </div>
  )
}
