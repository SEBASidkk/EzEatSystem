'use client'
import { useState } from 'react'
import {
  Plus, Trash2, CalendarDays, TrendingUp, User,
  Flag, StickyNote, Diamond, ChevronDown, ChevronUp,
} from 'lucide-react'
import { GanttChart } from './gantt-chart'
import type { GanttTask } from '@/actions/client-projects'

// ─── constants ───────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { hex: '#3B82F6', label: 'Azul'     },
  { hex: '#10B981', label: 'Verde'    },
  { hex: '#F59E0B', label: 'Ámbar'   },
  { hex: '#8B5CF6', label: 'Violeta' },
  { hex: '#EC4899', label: 'Rosa'    },
  { hex: '#0EA5E9', label: 'Cielo'   },
  { hex: '#14B8A6', label: 'Teal'    },
  { hex: '#F97316', label: 'Naranja' },
  { hex: '#EF4444', label: 'Rojo'    },
  { hex: '#64748B', label: 'Pizarra' },
]

const STATUS_OPTIONS: { value: GanttTask['status']; label: string; dot: string; ring: string }[] = [
  { value: 'no_iniciado', label: 'No iniciado', dot: '#94A3B8', ring: 'ring-slate-300'  },
  { value: 'en_progreso', label: 'En progreso', dot: '#3B82F6', ring: 'ring-blue-400'  },
  { value: 'completado',  label: 'Completado',  dot: '#10B981', ring: 'ring-emerald-400' },
  { value: 'bloqueado',   label: 'Bloqueado',   dot: '#EF4444', ring: 'ring-red-400'   },
]

const PRIORITY_OPTIONS: { value: NonNullable<GanttTask['priority']>; label: string; color: string; bg: string }[] = [
  { value: 'baja',    label: 'Baja',    color: 'text-slate-600', bg: 'bg-slate-100'  },
  { value: 'media',   label: 'Media',   color: 'text-blue-600',  bg: 'bg-blue-50'    },
  { value: 'alta',    label: 'Alta',    color: 'text-amber-600', bg: 'bg-amber-50'   },
  { value: 'critica', label: 'Crítica', color: 'text-red-600',   bg: 'bg-red-50'     },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function progressColor(pct: number) {
  if (pct >= 80) return '#10B981'
  if (pct >= 40) return '#3B82F6'
  return '#0F172A'
}

function newTask(): GanttTask {
  const today = new Date().toISOString().substring(0, 10) as string
  const end   = new Date(Date.now() + 14 * 86_400_000).toISOString().substring(0, 10) as string
  return {
    id:        crypto.randomUUID(),
    name:      '',
    start:     today,
    end,
    progress:  0,
    color:     PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]?.hex ?? '#3B82F6',
    status:    'no_iniciado',
    priority:  'media',
    milestone: false,
  }
}

// ─── sub-component: section label ────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
      <span className="text-slate-300">{icon}</span>
      {children}
    </p>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

interface Props {
  tasks: GanttTask[]
  onChange: (tasks: GanttTask[]) => void
}

export function GanttEditor({ tasks, onChange }: Props) {
  const [preview,       setPreview]       = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  function add()    { onChange([...tasks, newTask()]) }
  function remove(id: string) { onChange(tasks.filter(t => t.id !== id)) }
  function update(id: string, patch: Partial<GanttTask>) {
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t))
  }
  function toggleExpand(id: string) {
    setExpandedTasks(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Stats
  const done    = tasks.filter(t => t.status === 'completado').length
  const inProg  = tasks.filter(t => t.status === 'en_progreso').length
  const blocked = tasks.filter(t => t.status === 'bloqueado').length
  const avgPct  = tasks.length
    ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
    : 0

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-blue-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Gráfica Gantt</p>
              <p className="text-xs text-slate-400">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''} · avance promedio {avgPct}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreview(v => !v)}
              className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors cursor-pointer"
            >
              {preview ? '← Editar' : 'Vista previa →'}
            </button>
            <button
              type="button"
              onClick={add}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
            >
              <Plus size={13} /> Agregar tarea
            </button>
          </div>
        </div>

        {/* Mini stats bar */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { label: 'Completadas', val: done,    color: '#10B981' },
              { label: 'En progreso', val: inProg,  color: '#3B82F6' },
              { label: 'Bloqueadas',  val: blocked, color: '#EF4444' },
              { label: 'Pendientes',  val: tasks.filter(t => t.status === 'no_iniciado').length, color: '#94A3B8' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-slate-500">
                  <strong className="text-slate-700">{s.val}</strong> {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {preview ? (
        <div className="p-6">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin tareas para mostrar en el diagrama.</p>
          ) : (
            <GanttChart tasks={tasks} />
          )}
        </div>
      ) : (
        <>
          {tasks.length === 0 && (
            <div className="px-6 py-14 text-center">
              <CalendarDays size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">Sin tareas en el diagrama</p>
              <p className="text-xs text-slate-300 mt-1">Agrega la primera tarea con el botón de arriba</p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {tasks.map((task, idx) => {
              const expanded = expandedTasks.has(task.id)
              const statusCfg = STATUS_OPTIONS.find(s => s.value === task.status)!

              return (
                <div key={task.id} className="group">

                  {/* ── Collapsed header row ────────────────────────────── */}
                  <div
                    className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                    onClick={() => toggleExpand(task.id)}
                  >
                    {/* Number badge */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: task.color }}
                    >
                      {task.milestone ? <Diamond size={14} /> : idx + 1}
                    </div>

                    {/* Name + status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusCfg.dot }} />
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {task.name || <span className="text-slate-400 italic">Sin nombre</span>}
                        </span>
                        {task.priority && (
                          <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_OPTIONS.find(p => p.value === task.priority)?.bg ?? ''} ${PRIORITY_OPTIONS.find(p => p.value === task.priority)?.color ?? ''}`}>
                            {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {task.assignee && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User size={9} /> {task.assignee}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{task.start} → {task.end}</span>
                        {task.actualStart && (
                          <span className="text-[10px] text-blue-400">Real: {task.actualStart} → {task.actualEnd ?? '?'}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress pill */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${task.progress}%`, backgroundColor: progressColor(task.progress) }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: progressColor(task.progress) }}>
                        {task.progress}%
                      </span>
                    </div>

                    {/* Expand / delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); remove(task.id) }}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-1.5 text-slate-400">
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded fields ─────────────────────────────────── */}
                  {expanded && (
                    <div className="px-6 pb-6 space-y-6 bg-slate-50/30 border-t border-slate-100">

                      {/* Name */}
                      <div className="pt-4">
                        <SectionLabel icon={<Flag size={11} />}>Nombre de la tarea</SectionLabel>
                        <input
                          required
                          value={task.name}
                          onChange={e => update(task.id, { name: e.target.value })}
                          placeholder="Ej. Diseño de interfaz, Integración API, Pruebas UAT…"
                          className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            placeholder:text-slate-300 transition-shadow"
                        />
                      </div>

                      {/* Status + Priority + Milestone */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Status */}
                        <div>
                          <SectionLabel icon={<Flag size={11} />}>Estado</SectionLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map(s => (
                              <button
                                key={s.value}
                                type="button"
                                onClick={() => update(task.id, { status: s.value })}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                  task.status === s.value
                                    ? `${s.ring} ring-2 bg-white shadow-sm text-slate-800`
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Priority */}
                        <div>
                          <SectionLabel icon={<Flag size={11} />}>Prioridad</SectionLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {PRIORITY_OPTIONS.map(p => (
                              <button
                                key={p.value}
                                type="button"
                                onClick={() => update(task.id, { priority: p.value })}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                  task.priority === p.value
                                    ? `${p.bg} ${p.color} border-current ring-2 ring-current/30 shadow-sm`
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Milestone toggle + Color */}
                        <div className="space-y-4">
                          <div>
                            <SectionLabel icon={<Diamond size={11} />}>Hito (Milestone)</SectionLabel>
                            <button
                              type="button"
                              onClick={() => update(task.id, { milestone: !task.milestone })}
                              className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                task.milestone
                                  ? 'bg-violet-50 border-violet-300 text-violet-700 ring-2 ring-violet-200'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <Diamond size={13} />
                              {task.milestone ? 'Es un hito' : 'Marcar como hito'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Color picker */}
                      <div>
                        <SectionLabel icon={<Flag size={11} />}>Color de barra</SectionLabel>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map(({ hex, label }) => (
                            <button
                              key={hex}
                              type="button"
                              title={label}
                              onClick={() => update(task.id, { color: hex })}
                              className={`w-8 h-8 rounded-lg transition-all cursor-pointer border-2 ${
                                task.color === hex
                                  ? 'scale-110 border-slate-700 shadow-md'
                                  : 'border-transparent hover:scale-105 hover:border-slate-300'
                              }`}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Planned dates */}
                      <div>
                        <SectionLabel icon={<CalendarDays size={11} />}>Fechas planificadas (ideales)</SectionLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5 block">Inicio planificado</label>
                            <input
                              type="date"
                              value={task.start}
                              onChange={e => update(task.id, { start: e.target.value })}
                              className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5 block">Fin planificado</label>
                            <input
                              type="date"
                              value={task.end}
                              onChange={e => update(task.id, { end: e.target.value })}
                              className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actual dates */}
                      <div>
                        <SectionLabel icon={<CalendarDays size={11} />}>Fechas reales (ejecución)</SectionLabel>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5 block">
                              Inicio real <span className="normal-case font-normal">(opcional)</span>
                            </label>
                            <input
                              type="date"
                              value={task.actualStart ?? ''}
                              onChange={e => update(task.id, { actualStart: e.target.value || undefined })}
                              className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1.5 block">
                              Fin real <span className="normal-case font-normal">(opcional)</span>
                            </label>
                            <input
                              type="date"
                              value={task.actualEnd ?? ''}
                              onChange={e => update(task.id, { actualEnd: e.target.value || undefined })}
                              className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                            />
                          </div>
                        </div>
                        {task.actualStart && task.actualEnd && task.end && (() => {
                          const diff = Math.round(
                            (new Date(task.actualEnd + 'T00:00:00').getTime() -
                             new Date(task.end + 'T00:00:00').getTime()) / 86_400_000
                          )
                          if (diff === 0) return null
                          return (
                            <p className={`mt-2 text-xs font-semibold ${diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {diff > 0 ? `⚠ ${diff} día${diff !== 1 ? 's' : ''} de retraso vs planificado` : `✓ ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''} adelantado vs planificado`}
                            </p>
                          )
                        })()}
                      </div>

                      {/* Assignee */}
                      <div>
                        <SectionLabel icon={<User size={11} />}>Responsable</SectionLabel>
                        <input
                          value={task.assignee ?? ''}
                          onChange={e => update(task.id, { assignee: e.target.value || undefined })}
                          placeholder="Nombre del responsable o equipo…"
                          className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            placeholder:text-slate-300 transition-shadow"
                        />
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <SectionLabel icon={<TrendingUp size={11} />}>Avance de ejecución</SectionLabel>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: progressColor(task.progress) }}
                          >
                            {task.progress}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%`, backgroundColor: progressColor(task.progress) }}
                          />
                        </div>
                        <input
                          type="range"
                          min={0} max={100} step={5}
                          value={task.progress}
                          onChange={e => update(task.id, { progress: Number(e.target.value) })}
                          className="w-full cursor-pointer"
                          style={{ accentColor: progressColor(task.progress) }}
                        />
                        <div className="flex justify-between mt-1">
                          {[0, 25, 50, 75, 100].map(v => (
                            <span key={v} className="text-[10px] text-slate-300 tabular-nums">{v}%</span>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <SectionLabel icon={<StickyNote size={11} />}>Notas internas</SectionLabel>
                        <textarea
                          rows={2}
                          value={task.notes ?? ''}
                          onChange={e => update(task.id, { notes: e.target.value || undefined })}
                          placeholder="Bloqueos, dependencias, contexto de equipo…"
                          className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            placeholder:text-slate-300 resize-none transition-shadow"
                        />
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {tasks.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={add}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <Plus size={15} /> Agregar otra tarea
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
