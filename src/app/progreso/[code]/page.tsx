import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, Circle, CalendarDays, Zap } from 'lucide-react'
import { GanttChart } from '@/components/proyectos/gantt-chart'
import type { GanttTask } from '@/actions/client-projects'

interface Module {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

interface Update {
  date: string
  message: string
}

const STATUS_CONFIG = {
  completado:  { label: 'Completado',   icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  en_progreso: { label: 'En progreso',  icon: Zap,          color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
  pendiente:   { label: 'Pendiente',    icon: Circle,        color: 'text-slate-400',   bg: 'bg-slate-50',    border: 'border-slate-200'   },
}

function overallProgress(modules: Module[]) {
  if (!modules.length) return 0
  return Math.round(modules.reduce((sum, m) => sum + m.progress, 0) / modules.length)
}

function fmt(date: string | Date) {
  return new Date(date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function ProgresoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const project = await prisma.clientProject.findUnique({
    where: { accessCode: code },
  })

  if (!project || !project.active) notFound()

  const modules = project.modules as unknown as Module[]
  const updates = project.updates as unknown as Update[]
  const gantt   = (project.gantt ?? []) as unknown as GanttTask[]
  const overall = overallProgress(modules)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Portal de Progreso</p>
              <h1 className="text-2xl font-bold text-slate-900">{project.projectName}</h1>
              <p className="text-slate-500 mt-0.5">{project.clientName}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-900">{overall}%</div>
              <p className="text-xs text-slate-400 mt-0.5">completado</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${overall}%`,
                backgroundColor: overall >= 80 ? '#10B981' : overall >= 40 ? '#3B82F6' : '#0F172A',
              }}
            />
          </div>

          {/* Dates */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays size={13} />
              <span>Inicio: {fmt(project.startDate)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={13} />
              <span>Entrega est.: {fmt(project.estimatedEnd)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modules */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Módulos</h2>
          {modules.length === 0 && (
            <p className="text-sm text-slate-400">Sin módulos registrados aún.</p>
          )}
          {modules.map((mod, i) => {
            const cfg = STATUS_CONFIG[mod.status]
            const Icon = cfg.icon
            return (
              <div key={i} className={`bg-white rounded-xl border ${cfg.border} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon size={15} className={cfg.color} />
                    <span className="font-medium text-slate-800 text-sm">{mod.name}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${mod.progress}%`,
                      backgroundColor: mod.status === 'completado' ? '#10B981' : mod.status === 'en_progreso' ? '#3B82F6' : '#CBD5E1',
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1 text-right">{mod.progress}%</p>
              </div>
            )
          })}
        </div>

        {/* Updates feed */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Actualizaciones</h2>
          {updates.length === 0 && (
            <p className="text-sm text-slate-400">Sin actualizaciones aún.</p>
          )}
          <div className="space-y-3">
            {[...updates].reverse().map((u, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400 mb-1">{fmt(u.date)}</p>
                <p className="text-sm text-slate-700">{u.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt */}
      {gantt.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-8">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Línea de tiempo</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <GanttChart tasks={gantt} />
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-300 pb-8">
        Powered by EzEat System — Código de acceso: {code}
      </p>
    </div>
  )
}
