import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import {
  Clock, Circle, CalendarDays, Utensils,
  TrendingUp, MessageSquare, Phone,
  Mail, MessageCircle, Video, Globe, Printer, Users,
} from 'lucide-react'
import { GanttChart } from '@/components/proyectos/gantt-chart'
import { ModuleSection } from '@/components/progreso/module-section'
import type { GanttTask, ProjectContact, ProjectCommunication, ProjectComment, ProjectApproval } from '@/actions/client-projects'

// ─── types ────────────────────────────────────────────────────────────────────

interface Module {
  name: string
  status: 'pendiente' | 'en_progreso' | 'completado'
  progress: number
}

interface Update { date: string; message: string }

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
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}

// ─── circular progress ring ───────────────────────────────────────────────────

function ProgressRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const off  = circ * (1 - pct / 100)
  const color = pct >= 80 ? '#10B981' : pct >= 40 ? '#3B82F6' : '#0F172A'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

// ─── communication icon map ───────────────────────────────────────────────────

const COMM_ICON: Record<string, React.ElementType> = {
  whatsapp: MessageCircle,
  email:    Mail,
  phone:    Phone,
  slack:    MessageSquare,
  meet:     Video,
  teams:    Video,
  other:    Globe,
}

const COMM_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-50 text-green-600 border-green-200',
  email:    'bg-blue-50 text-blue-600 border-blue-200',
  phone:    'bg-slate-50 text-slate-600 border-slate-200',
  slack:    'bg-purple-50 text-purple-600 border-purple-200',
  meet:     'bg-red-50 text-red-600 border-red-200',
  teams:    'bg-indigo-50 text-indigo-600 border-indigo-200',
  other:    'bg-slate-50 text-slate-600 border-slate-200',
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function ProgresoPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const project  = await prisma.clientProject.findUnique({ where: { accessCode: code } })
  if (!project || !project.active) notFound()

  const modules        = project.modules        as unknown as Module[]
  const updates        = project.updates        as unknown as Update[]
  const gantt          = (project.gantt ?? [])  as unknown as GanttTask[]
  const contacts       = (project.contacts       ?? []) as unknown as ProjectContact[]
  const communications = (project.communications ?? []) as unknown as ProjectCommunication[]
  const comments       = (project.comments       ?? []) as unknown as ProjectComment[]
  const approvals      = (project.approvals      ?? []) as unknown as ProjectApproval[]
  const overall        = overallProgress(modules)

  const done    = modules.filter(m => m.status === 'completado').length
  const inProg  = modules.filter(m => m.status === 'en_progreso').length
  const pending = modules.filter(m => m.status === 'pendiente').length

  const remaining = daysLeft(project.estimatedEnd)
  const isOverdue = remaining < 0
  const isSoon    = remaining >= 0 && remaining <= 7

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Top nav ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 print:hidden">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <Utensils size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">Ez-eat</span>
            <span className="text-slate-200 text-lg font-light">/</span>
            <span className="text-sm text-slate-500 truncate max-w-[200px]">{project.projectName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: overall >= 80 ? '#ECFDF5' : overall >= 40 ? '#EFF6FF' : '#F8FAFC',
                color: overall >= 80 ? '#059669' : overall >= 40 ? '#2563EB' : '#64748B',
              }}>
              {overall}% completado
            </span>
            <a
              href={`/progreso/${code}/print`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer size={13} /> Exportar PDF
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
            <div className="relative shrink-0">
              <ProgressRing pct={overall} size={128} stroke={10} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums"
                  style={{ color: overall >= 80 ? '#059669' : overall >= 40 ? '#2563EB' : '#0F172A' }}>
                  {overall}%
                </span>
                <span className="text-[10px] text-slate-400 font-medium">avance</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Portal de progreso</p>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">{project.projectName}</h1>
              <p className="text-lg text-slate-500 mt-0.5">{project.clientName}</p>
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
                    : isSoon ? `${remaining}d para entrega`
                    : `Entrega: ${fmt(project.estimatedEnd)}`}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              {[
                { label: 'Listos',      val: done,    color: '#10B981', bg: '#ECFDF5' },
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

          <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progreso general</span>
              <span className="font-semibold text-slate-600">{overall}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${overall}%`,
                  backgroundColor: overall >= 80 ? '#10B981' : overall >= 40 ? '#3B82F6' : '#0F172A',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Modules (interactive, 2 cols) ─────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
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
              <ModuleSection
                accessCode={code}
                modules={modules}
                comments={comments}
                approvals={approvals}
              />
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Updates feed */}
            <div>
              <div className="flex items-center gap-2 mb-4">
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
                  <div className="absolute left-3.5 top-4 bottom-4 w-px bg-slate-100" />
                  <div className="space-y-1">
                    {[...updates].reverse().map((u, i) => (
                      <div key={i} className="relative pl-10">
                        <div className={`absolute left-2 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                        <div className={`bg-white border rounded-2xl p-4 mb-3 shadow-sm ${i === 0 ? 'border-blue-100' : 'border-slate-100'}`}>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{fmtShort(u.date)}</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{u.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery countdown */}
            <div className={`rounded-2xl p-4 border ${
              isOverdue ? 'bg-red-50 border-red-200' : isSoon ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${
                isOverdue ? 'text-red-600' : isSoon ? 'text-amber-700' : 'text-slate-500'
              }`}>
                {isOverdue ? 'Retraso' : 'Fecha de entrega'}
              </p>
              <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : isSoon ? 'text-amber-800' : 'text-slate-700'}`}>
                {fmt(project.estimatedEnd)}
              </p>
              {!isOverdue ? (
                <p className={`text-xs mt-0.5 ${isSoon ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                  {remaining === 0 ? 'Es hoy' : `${remaining} día${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}`}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-0.5">{Math.abs(remaining)} días de retraso</p>
              )}
            </div>

            {/* Communications */}
            {communications.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4">Contacta al equipo</p>
                <div className="space-y-2">
                  {communications.map((c, i) => {
                    const Icon   = COMM_ICON[c.type] ?? Globe
                    const colors = COMM_COLOR[c.type] ?? COMM_COLOR.other!
                    const isLink = c.value.startsWith('http') || c.type === 'whatsapp'
                    const href   = c.type === 'whatsapp'
                      ? `https://wa.me/${c.value.replace(/\D/g, '')}`
                      : c.type === 'email'
                      ? `mailto:${c.value}`
                      : c.type === 'phone'
                      ? `tel:${c.value}`
                      : c.value
                    return (
                      <a
                        key={i}
                        href={isLink || c.type === 'email' || c.type === 'phone' ? href : undefined}
                        target={c.type === 'whatsapp' || c.value.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 ${colors} ${isLink || c.type === 'email' || c.type === 'phone' ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <Icon size={16} className="shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{c.label}</p>
                          <p className="text-[10px] opacity-70 truncate">{c.value}</p>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Contacts */}
            {contacts.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={14} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Equipo del proyecto</p>
                </div>
                <div className="space-y-3">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        {c.role && <p className="text-[10px] text-slate-400">{c.role}</p>}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="text-[10px] text-blue-500 hover:underline truncate block">{c.email}</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Gantt timeline ────────────────────────────────────────── */}
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

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white mt-10 print:hidden">
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
