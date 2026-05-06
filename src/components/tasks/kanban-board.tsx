'use client'
import { updateTaskStatus } from '@/actions/tasks'
import { useTransition, useState } from 'react'
import { Search, Calendar, MoreHorizontal, AlertTriangle } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

const COLUMNS = [
  { id: 'BACKLOG',     label: 'Queue / Backlog', statuses: ['TODO', 'BLOCKED'],    headerCls: 'text-slate-700' },
  { id: 'IN_PROGRESS', label: 'In Progress',     statuses: ['IN_PROGRESS'],         headerCls: 'text-blue-600'  },
  { id: 'DONE',        label: 'Verified / Closed', statuses: ['DONE'],              headerCls: 'text-teal-600'  },
]

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  URGENT: { label: 'High Priority',   bg: 'bg-red-50',    text: 'text-red-600'    },
  HIGH:   { label: 'High Priority',   bg: 'bg-red-50',    text: 'text-red-600'    },
  MEDIUM: { label: 'Medium Priority', bg: 'bg-amber-50',  text: 'text-amber-600'  },
  LOW:    { label: 'Low Priority',    bg: 'bg-slate-100', text: 'text-slate-500'  },
}

const PRIORITIES = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  assignedTo: { id: string; name: string } | null
  dueDate: Date | null
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

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const [search, setSearch]   = useState('')
  const [priority, setPriority] = useState('ALL')
  const assignees = ['ALL', ...Array.from(new Set(tasks.map((t) => t.assignedTo?.name).filter((n): n is string => !!n)))]
  const [assignee, setAssignee] = useState('ALL')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filtered = tasks.filter((t) => {
    const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === 'ALL' || t.priority === priority
    const matchAssignee = assignee === 'ALL' || t.assignedTo?.name === assignee
    return matchSearch && matchPriority && matchAssignee
  })

  function moveTask(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      toast('Task updated', 'info')
      setOpenMenu(null)
    })
  }

  const STATUS_TARGETS: Record<string, { label: string; status: string }[]> = {
    BACKLOG:     [{ label: 'Move to In Progress', status: 'IN_PROGRESS' }, { label: 'Close', status: 'DONE' }],
    IN_PROGRESS: [{ label: 'Return to Backlog', status: 'TODO' },          { label: 'Verify & Close', status: 'DONE' }],
    DONE:        [{ label: 'Reopen', status: 'TODO' }],
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search operational index..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'All Priorities' : p}</option>
          ))}
        </select>
        {assignees.length > 1 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {assignees.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'All Assignees' : a}</option>
            ))}
          </select>
        )}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => getColumnId(t.status) === col.id)
          const isDone = col.id === 'DONE'
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.headerCls}`}>
                  {col.label}
                </h3>
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                  {colTasks.length}
                </span>
              </div>

              {/* Column bar */}
              <div className={`h-1 rounded-full mb-3 ${isDone ? 'bg-teal-500' : col.id === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />

              {/* Cards */}
              <div className="space-y-3 overflow-y-auto flex-1">
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">Empty</p>
                )}
                {colTasks.map((task) => {
                  const pcfg = PRIORITY_CONFIG[task.priority] ?? { label: 'Low Priority', bg: 'bg-slate-100', text: 'text-slate-500' }
                  const overdue = isOverdue(task.dueDate) && !isDone
                  const initials = task.assignedTo ? getInitials(task.assignedTo.name) : null
                  const targets = STATUS_TARGETS[col.id] ?? []

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-lg border p-4 relative ${
                        isDone ? 'opacity-70 border-slate-200' : overdue ? 'border-red-200' : 'border-slate-200'
                      } hover:shadow-sm transition-shadow`}
                    >
                      {/* Priority badge */}
                      <div className="flex items-start justify-between mb-2.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${pcfg.bg} ${pcfg.text}`}>
                          {pcfg.label}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenu(openMenu === task.id ? null : task.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenu === task.id && (
                            <div className="absolute right-0 top-6 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44">
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

                      {/* Title */}
                      <p className={`font-semibold text-sm mb-1.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </p>

                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2">{task.description}</p>
                      )}

                      {/* Progress bar for IN_PROGRESS */}
                      {col.id === 'IN_PROGRESS' && (
                        <div className="w-full h-1 bg-slate-100 rounded-full mb-2.5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={11} />
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {overdue && (
                            <span className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                              <AlertTriangle size={10} />
                              Overdue
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
                          <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">✓ Verified</span>
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

      {/* Close menu on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}
