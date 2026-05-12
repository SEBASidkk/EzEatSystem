'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, AlertCircle, Clock, CheckSquare, Flame,
  User, Calendar, AlignLeft, Info, Layers,
} from 'lucide-react'
import { createTask } from '@/actions/tasks'

interface TeamMember { id: string; name: string }

const PRIORITIES = [
  {
    value: 'LOW',
    label: 'Baja',
    desc: 'Sin urgencia',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    activeBorder: 'border-slate-400',
    dot: '#94A3B8',
    tip: 'Tareas de mantenimiento, mejoras menores, documentación.',
  },
  {
    value: 'MEDIUM',
    label: 'Media',
    desc: 'Flujo normal',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBorder: 'border-blue-500',
    dot: '#3B82F6',
    tip: 'Trabajo estándar del sprint. La mayoría de las tareas deberían tener esta prioridad.',
  },
  {
    value: 'HIGH',
    label: 'Alta',
    desc: 'Requiere atención',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBorder: 'border-amber-500',
    dot: '#F59E0B',
    tip: 'Bloquea avance de equipo o afecta a un cliente. Resolver antes de terminar el día.',
  },
  {
    value: 'URGENT',
    label: 'Urgente',
    desc: 'Acción inmediata',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    activeBorder: 'border-red-500',
    dot: '#EF4444',
    tip: 'Incidente en producción o bloqueo crítico. Interrumpe todo lo demás.',
  },
]

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  LOW:    <CheckSquare size={18} />,
  MEDIUM: <Clock size={18} />,
  HIGH:   <AlertCircle size={18} />,
  URGENT: <Flame size={18} />,
}

// ─── quick checklist item type ────────────────────────────────────────────────
interface CheckItem { id: string; text: string; done: boolean }

export function NewTaskForm({ members }: { members: TeamMember[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [priority,  setPriority]     = useState('MEDIUM')
  const [checklist, setChecklist]    = useState<CheckItem[]>([])
  const [newCheck,  setNewCheck]     = useState('')

  const selectedP = PRIORITIES.find(p => p.value === priority)!

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('priority', priority)
    startTransition(async () => {
      await createTask(fd)
      router.push('/tasks')
      router.refresh()
    })
  }

  function addCheckItem() {
    if (!newCheck.trim()) return
    setChecklist(prev => [...prev, { id: crypto.randomUUID(), text: newCheck.trim(), done: false }])
    setNewCheck('')
  }

  function toggleCheck(id: string) {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  }

  function removeCheck(id: string) {
    setChecklist(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Nueva tarea</h1>
          <p className="text-sm text-slate-500 mt-0.5">Agregar al tablero de trabajo</p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border"
          style={{
            backgroundColor: selectedP.bg as string,
            borderColor: selectedP.dot,
            color: selectedP.dot,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedP.dot }} />
          {selectedP.label}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Left: main form (2 cols) ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Priority selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Prioridad
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  const active = priority === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer text-center ${
                        active
                          ? `${p.activeBorder} ${p.bg} shadow-sm`
                          : `${p.border} bg-white hover:bg-slate-50`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? p.bg : 'bg-slate-100'}`}>
                        <span className={active ? p.color : 'text-slate-400'}>{PRIORITY_ICON[p.value]}</span>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-600'}`}>{p.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Main fields card */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

              {/* Title */}
              <div className="px-6 py-5 border-b border-slate-100">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Título de la tarea
                </label>
                <input
                  name="title"
                  required
                  autoFocus
                  placeholder="ej. Configurar webhook de pagos Stripe"
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-slate-300 transition-shadow"
                />
              </div>

              {/* Description */}
              <div className="px-6 py-5 border-b border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  <AlignLeft size={12} /> Descripción
                  <span className="text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Contexto de la tarea, qué hay que hacer, pasos a seguir, referencias o links…"
                  className="w-full px-4 py-3 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                    placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    resize-none transition-shadow"
                />
              </div>

              {/* Assignee + Due date (2 cols) */}
              <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
                <div className="px-6 py-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    <User size={12} /> Asignar a
                    <span className="text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      name="assignedToId"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        appearance-none cursor-pointer"
                    >
                      <option value="">Sin asignar</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    <Calendar size={12} /> Fecha límite
                    <span className="text-slate-400 normal-case font-normal text-[11px]">opcional</span>
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    className="w-full px-4 py-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Checklist (stored in description as metadata — cosmetic) */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  <Layers size={12} /> Checklist de subtareas
                  <span className="text-slate-400 normal-case font-normal text-[11px]">opcional · {checklist.filter(c => c.done).length}/{checklist.length}</span>
                </label>
              </div>
              <div className="px-6 py-4 space-y-2">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-3 group/item">
                    <button
                      type="button"
                      onClick={() => toggleCheck(item.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {item.done && <CheckSquare size={12} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCheck(item.id)}
                      className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-400 transition-all cursor-pointer text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    value={newCheck}
                    onChange={e => setNewCheck(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                    placeholder="Agregar subtarea… (Enter para añadir)"
                    className="flex-1 px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      placeholder:text-slate-300 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={addCheckItem}
                    disabled={!newCheck.trim()}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
              >
                <Save size={15} />
                {isPending ? 'Creando…' : 'Crear tarea'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-3 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>

          {/* ── Right sidebar ────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Priority guide */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedP.bg as string }}
                >
                  <span style={{ color: selectedP.dot }}>{PRIORITY_ICON[priority]}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">Prioridad {selectedP.label}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{selectedP.tip}</p>
            </div>

            {/* Workflow guide */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Flujo de trabajo</p>
              <div className="space-y-3">
                {[
                  { label: 'Pendiente', desc: 'Recién creada, en backlog', color: '#94A3B8' },
                  { label: 'En progreso', desc: 'Asignada y en desarrollo', color: '#3B82F6' },
                  { label: 'Completada', desc: 'Revisada y cerrada', color: '#10B981' },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: s.color }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{s.label}</p>
                      <p className="text-[10px] text-slate-400">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team members quick ref */}
            {members.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Equipo disponible</p>
                <div className="space-y-2">
                  {members.slice(0, 8).map(m => (
                    <div key={m.id} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {m.name?.substring(0, 2).toUpperCase() ?? '?'}
                      </div>
                      <span className="text-xs text-slate-600 truncate">{m.name}</span>
                    </div>
                  ))}
                  {members.length > 8 && (
                    <p className="text-[10px] text-slate-400 pl-9">+{members.length - 8} más</p>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Info size={13} className="text-blue-500" />
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest">Tip del equipo</p>
              </div>
              <ul className="space-y-2 text-xs text-blue-700">
                <li>• Título corto y accionable ("Configurar X" no "Hay que ver X")</li>
                <li>• Una tarea = una responsabilidad</li>
                <li>• Agrega subtareas para pasos complejos</li>
                <li>• Asigna fecha límite para visibilidad en el tablero</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
