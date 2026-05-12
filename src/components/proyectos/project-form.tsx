'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, Link2 } from 'lucide-react'
import type { ProjectModule, ProjectUpdate, GanttTask } from '@/actions/client-projects'
import { GanttEditor } from './gantt-editor'

const STATUS_OPTIONS = [
  { value: 'pendiente',   label: 'Pendiente'   },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado',  label: 'Completado'  },
]

interface Props {
  mode: 'new' | 'edit'
  initialData?: {
    id: string
    accessCode: string
    clientName: string
    projectName: string
    startDate: Date
    estimatedEnd: Date
    modules: ProjectModule[]
    updates: ProjectUpdate[]
    gantt: GanttTask[]
    active: boolean
  }
  onSubmit: (data: {
    accessCode: string
    clientName: string
    projectName: string
    startDate: string
    estimatedEnd: string
    modules: ProjectModule[]
    updates: ProjectUpdate[]
    gantt: GanttTask[]
    active: boolean
  }) => Promise<void>
  onDelete?: () => Promise<void>
}

function toInputDate(d: Date) {
  return new Date(d).toISOString().substring(0, 10)
}

export function ProjectForm({ mode, initialData, onSubmit, onDelete }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  const [accessCode,   setAccessCode]   = useState(initialData?.accessCode   ?? '')
  const [clientName,   setClientName]   = useState(initialData?.clientName   ?? '')
  const [projectName,  setProjectName]  = useState(initialData?.projectName  ?? '')
  const [startDate,    setStartDate]    = useState(initialData ? toInputDate(initialData.startDate)    : '')
  const [estimatedEnd, setEstimatedEnd] = useState(initialData ? toInputDate(initialData.estimatedEnd) : '')
  const [active,       setActive]       = useState(initialData?.active ?? true)
  const [modules,      setModules]      = useState<ProjectModule[]>(initialData?.modules ?? [])
  const [updates,      setUpdates]      = useState<ProjectUpdate[]>(initialData?.updates ?? [])
  const [gantt,        setGantt]        = useState<GanttTask[]>(initialData?.gantt ?? [])

  function addModule() {
    setModules(prev => [...prev, { name: '', status: 'pendiente', progress: 0 }])
  }

  function updateModule(i: number, patch: Partial<ProjectModule>) {
    setModules(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  }

  function removeModule(i: number) {
    setModules(prev => prev.filter((_, idx) => idx !== i))
  }

  function addUpdate() {
    setUpdates(prev => [...prev, { date: new Date().toISOString(), message: '' }])
  }

  function updateEntry(i: number, patch: Partial<ProjectUpdate>) {
    setUpdates(prev => prev.map((u, idx) => idx === i ? { ...u, ...patch } : u))
  }

  function removeUpdate(i: number) {
    setUpdates(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await onSubmit({ accessCode, clientName, projectName, startDate, estimatedEnd, modules, updates, gantt, active })
      router.push('/proyectos')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!onDelete) return
    startDelete(async () => {
      await onDelete()
      router.push('/proyectos')
      router.refresh()
    })
  }

  const publicUrl = `/progreso/${accessCode}`

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'new' ? 'Nuevo portal de cliente' : 'Editar portal de cliente'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {mode === 'new' ? 'Genera un link de acceso para tu cliente' : 'Actualiza el progreso del proyecto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info básica */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Información del proyecto</p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="px-5 py-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Código de acceso</label>
              <input
                required
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                placeholder="ej. QUEFRESA-2026"
                disabled={mode === 'edit'}
                className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400 disabled:opacity-50"
              />
              {accessCode && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-600">
                  <Link2 size={11} />
                  <span className="truncate">{publicUrl}</span>
                </div>
              )}
            </div>

            <div className="px-5 py-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del cliente</label>
              <input
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="ej. QueFresa"
                className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="px-5 py-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del proyecto</label>
              <input
                required
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="ej. Portal Operativo Empresarial"
                className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="px-5 py-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Inicio</label>
                <input
                  required
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none"
                />
              </div>
              <div className="px-5 py-4">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Entrega estimada</label>
                <input
                  required
                  type="date"
                  value={estimatedEnd}
                  onChange={e => setEstimatedEnd(e.target.value)}
                  className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none"
                />
              </div>
            </div>

            {mode === 'edit' && (
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Portal activo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Si está inactivo, el cliente verá error 404</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(v => !v)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-[18px]' : ''}`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Módulos */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Módulos</p>
            <button
              type="button"
              onClick={addModule}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              <Plus size={13} /> Agregar
            </button>
          </div>

          {modules.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Sin módulos — agrega uno arriba</p>
          )}

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {modules.map((mod, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <input
                    required
                    value={mod.name}
                    onChange={e => updateModule(i, { name: e.target.value })}
                    placeholder="Nombre del módulo"
                    className="flex-1 text-sm font-medium text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeModule(i)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <select
                  value={mod.status}
                  onChange={e => updateModule(i, { status: e.target.value as ProjectModule['status'] })}
                  className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer w-full"
                >
                  {STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={mod.progress}
                    onChange={e => updateModule(i, { progress: Number(e.target.value) })}
                    className="flex-1 accent-slate-800"
                  />
                  <span className="text-xs font-semibold text-slate-600 w-9 text-right">{mod.progress}%</span>
                </div>
                {/* mini progress bar */}
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${mod.progress}%`,
                      backgroundColor: mod.status === 'completado' ? '#10B981' : mod.status === 'en_progreso' ? '#3B82F6' : '#CBD5E1',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actualizaciones */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Actualizaciones para el cliente</p>
            <button
              type="button"
              onClick={addUpdate}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              <Plus size={13} /> Agregar
            </button>
          </div>

          {updates.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Sin actualizaciones — agrega una arriba</p>
          )}

          <div className="divide-y divide-slate-100">
            {updates.map((u, i) => (
              <div key={i} className="px-5 py-4 flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="date"
                    value={u.date.split('T')[0]}
                    onChange={e => updateEntry(i, { date: new Date(e.target.value).toISOString() })}
                    className="text-xs text-slate-500 bg-transparent border-0 focus:outline-none"
                  />
                  <textarea
                    required
                    rows={2}
                    value={u.message}
                    onChange={e => updateEntry(i, { message: e.target.value })}
                    placeholder="Describe qué avanzó..."
                    className="w-full text-sm text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400 resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeUpdate(i)}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gantt */}
        <GanttEditor tasks={gantt} onChange={setGantt} />

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Save size={15} />
            {isPending ? 'Guardando...' : mode === 'new' ? 'Crear portal' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
