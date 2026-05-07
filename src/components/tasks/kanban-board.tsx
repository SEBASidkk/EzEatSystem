'use client'
import { updateTaskStatus, updateTask } from '@/actions/tasks'
import { useTransition, useState } from 'react'
import { Search, Calendar, MoreHorizontal, AlertTriangle, X, Save } from 'lucide-react'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

const COLUMNS = [
  { id: 'BACKLOG',      label: 'Cola / Backlog',      statuses: ['TODO', 'BLOCKED'],  headerCls: 'text-slate-700' },
  { id: 'IN_PROGRESS',  label: 'En Progreso',          statuses: ['IN_PROGRESS'],      headerCls: 'text-blue-600'  },
  { id: 'DONE',         label: 'Verificado / Cerrado', statuses: ['DONE'],             headerCls: 'text-teal-600'  },
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  URGENT: { label: 'Prioridad Alta',   bg: 'bg-red-50',    text: 'text-red-600'    },
  HIGH:   { label: 'Prioridad Alta',   bg: 'bg-red-50',    text: 'text-red-600'    },
  MEDIUM: { label: 'Prioridad Media',  bg: 'bg-amber-50',  text: 'text-amber-600'  },
  LOW:    { label: 'Prioridad Baja',   bg: 'bg-slate-100', text: 'text-slate-500'  },
}

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' }

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate: Date | null
  assignedTo: { id: string; name: string } | null
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function isOverdue(dueDate: Date | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function getColumnId(status: string) {
  if (status === 'TODO' || status === 'BLOCKED') return 'BACKLOG'
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS'
  return 'DONE'
}

interface EditModalProps {
  task: Task
  onClose: () => void
  onSave: () => void
}

function EditTaskModal({ task, onClose, onSave }: EditModalProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateTask(task.id, fd)
      toast('Tarea actualizada', 'success')
      onSave()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">Editar tarea</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Título</label>
            <input
              name="title"
              defaultValue={task.title}
              required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Descripción</label>
            <textarea
              name="description"
              defaultValue={task.description ?? ''}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Prioridad</label>
            <select
              name="priority"
              defaultValue={task.priority}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Fecha límite</label>
            <input
              name="dueDate"
              type="date"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Save size={14} />
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [priority, setPriority] = useState('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const assignees = ['ALL', ...Array.from(new Set(tasks.map((t) => t.assignedTo?.name).filter((n): n is string => !!n)))]
  const [assignee, setAssignee] = useState('ALL')

  const filtered = tasks.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === 'ALL' || t.priority === priority
    const matchAssignee = assignee === 'ALL' || t.assignedTo?.name === assignee
    return matchSearch && matchPriority && matchAssignee
  })

  function moveTask(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      toast('Tarea actualizada', 'info')
      setOpenMenu(null)
      router.refresh()
    })
  }

  const STATUS_TARGETS: Record<string, { label: string; status: string }[]> = {
    BACKLOG:     [{ label: 'Mover a En Progreso', status: 'IN_PROGRESS' }, { label: 'Cerrar', status: 'DONE' }],
    IN_PROGRESS: [{ label: 'Regresar a Backlog', status: 'TODO' },         { label: 'Verificar y Cerrar', status: 'DONE' }],
    DONE:        [{ label: 'Reabrir', status: 'TODO' }],
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {editTask && (
        <EditTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={() => { setEditTask(null); router.refresh() }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Todas las prioridades</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>
        {assignees.length > 1 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assignees.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'Todos los asignados' : a}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => getColumnId(t.status) === col.id)
          const isDone = col.id === 'DONE'
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.headerCls}`}>{col.label}</h3>
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>
              <div className={`h-1 rounded-full mb-3 ${isDone ? 'bg-teal-500' : col.id === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
              <div className="space-y-3 overflow-y-auto flex-1">
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Vacío</p>
                )}
                {colTasks.map((task) => {
                  const pcfg = PRIORITY_CONFIG[task.priority] ?? { label: 'Prioridad Baja', bg: 'bg-slate-100', text: 'text-slate-500' }
                  const overdue = isOverdue(task.dueDate) && !isDone
                  const initials = task.assignedTo ? getInitials(task.assignedTo.name) : null
                  const targets = STATUS_TARGETS[col.id] ?? []
                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-lg border p-4 relative cursor-pointer hover:shadow-md transition-all duration-150 ${
                        isDone ? 'opacity-70 border-slate-200' : overdue ? 'border-red-200' : 'border-slate-200'
                      }`}
                      onClick={() => setEditTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${pcfg.bg} ${pcfg.text}`}>
                          {pcfg.label}
                        </span>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenu === task.id && (
                            <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-48">
                              <button
                                onClick={() => { setEditTask(task); setOpenMenu(null) }}
                                className="w-full px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                              >
                                Editar tarea
                              </button>
                              {targets.map((t) => (
                                <button
                                  key={t.status}
                                  onClick={() => moveTask(task.id, t.status)}
                                  className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className={`font-semibold text-sm mb-1.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2">{task.description}</p>
                      )}
                      {col.id === 'IN_PROGRESS' && (
                        <div className="w-full h-1 bg-slate-100 rounded-full mb-2.5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={11} />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
                            : '—'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {overdue && (
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} />
                              Vencida
                            </span>
                          )}
                          {initials && (
                            <div
                              className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                              title={task.assignedTo!.name}
                              style={{ backgroundColor: '#0F172A' }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>
                      </div>
                      {isDone && (
                        <div className="absolute top-3 left-3 opacity-30">
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">✓ Verificado</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
