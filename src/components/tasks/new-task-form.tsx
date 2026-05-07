'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, AlertCircle, Clock, CheckSquare, Flame,
  User, Calendar, AlignLeft, Tag,
} from 'lucide-react'
import { createTask } from '@/actions/tasks'

interface TeamMember { id: string; name: string }

const PRIORITIES = [
  { value: 'LOW',    label: 'Baja',    desc: 'Sin urgencia',   color: 'text-slate-600',  bg: 'bg-slate-50',   border: 'border-slate-200',  activeBorder: 'border-slate-400',  dot: '#94A3B8' },
  { value: 'MEDIUM', label: 'Media',   desc: 'Estándar',       color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200',   activeBorder: 'border-blue-500',   dot: '#3B82F6' },
  { value: 'HIGH',   label: 'Alta',    desc: 'Requiere atención', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',  activeBorder: 'border-amber-500',  dot: '#F59E0B' },
  { value: 'URGENT', label: 'Urgente', desc: 'Acción inmediata', color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200',    activeBorder: 'border-red-500',    dot: '#EF4444' },
]

const PRIORITY_ICON: Record<string, React.ReactNode> = {
  LOW:    <CheckSquare size={16} />,
  MEDIUM: <Clock size={16} />,
  HIGH:   <AlertCircle size={16} />,
  URGENT: <Flame size={16} />,
}

export function NewTaskForm({ members }: { members: TeamMember[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [priority, setPriority] = useState('MEDIUM')

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

  const selectedP = PRIORITIES.find(p => p.value === priority)!

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Volver"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva tarea</h1>
          <p className="text-sm text-slate-500 mt-0.5">Agregar al tablero de trabajo</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: selectedP.bg as string }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedP.dot }} />
          <span className={selectedP.color}>{selectedP.label}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Priority selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-3">
            Prioridad
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRIORITIES.map((p) => {
              const active = priority === p.value
              const Icon = PRIORITY_ICON[p.value]
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? p.bg : 'bg-slate-100'}`}>
                    <span className={active ? p.color : 'text-slate-400'}>{Icon}</span>
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${active ? 'text-slate-900' : 'text-slate-600'}`}>
                      {p.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main fields card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Title */}
          <div className="px-5 py-4 border-b border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
              Título de la tarea
            </label>
            <input
              name="title"
              required
              autoFocus
              placeholder="ej. Configurar webhook de pagos Stripe"
              className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 border-0 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Description */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={13} className="text-slate-400" />
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                Descripción
                <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
              </label>
            </div>
            <textarea
              name="description"
              rows={3}
              placeholder="Contexto, pasos a seguir, referencias..."
              className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm placeholder-slate-400 border-0 focus:outline-none focus:ring-0 resize-none"
            />
          </div>

          {/* Assignee */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <User size={13} className="text-slate-400" />
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                Asignar a
                <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
              </label>
            </div>
            <select
              name="assignedToId"
              className="w-full px-0 py-1 bg-transparent text-sm text-slate-900 border-0 focus:outline-none focus:ring-0 appearance-none cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} className="text-slate-400" />
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                Fecha límite
                <span className="ml-1.5 text-slate-400 normal-case font-normal text-[11px]">opcional</span>
              </label>
            </div>
            <input
              name="dueDate"
              type="date"
              className="w-full px-0 py-1 bg-transparent text-slate-900 text-sm border-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors duration-150 cursor-pointer"
          >
            <Save size={15} />
            {isPending ? 'Creando...' : 'Crear tarea'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
          >
            Cancelar
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <Tag size={12} className="text-slate-400" />
            <span className="text-xs text-slate-400">Estado inicial: Pendiente</span>
          </div>
        </div>
      </form>
    </div>
  )
}
