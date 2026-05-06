'use client'
import { updateTaskStatus } from '@/actions/tasks'
import { useTransition, useState } from 'react'
import { Search } from 'lucide-react'
import { useToast } from '@/lib/toast-context'

const COLUMNS = [
  { id: 'TODO', label: 'Por hacer', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'En progreso', color: 'bg-blue-50' },
  { id: 'BLOCKED', label: 'Bloqueado', color: 'bg-red-50' },
  { id: 'DONE', label: 'Hecho', color: 'bg-green-50' },
]

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
}

const PRIORITIES = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW']

interface Task {
  id: string
  title: string
  priority: string
  status: string
  assignedTo: { id: string; name: string } | null
  dueDate: Date | null
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('ALL')
  const assignees = ['ALL', ...Array.from(new Set(tasks.map((t) => t.assignedTo?.name).filter((n): n is string => !!n)))]
  const [assignee, setAssignee] = useState('ALL')

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
    const matchPriority = priority === 'ALL' || t.priority === priority
    const matchAssignee = assignee === 'ALL' || t.assignedTo?.name === assignee
    return matchSearch && matchPriority && matchAssignee
  })

  function moveTask(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      toast('Tarea actualizada', 'info')
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tarea..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'Todas las prioridades' : p}</option>
          ))}
        </select>
        {assignees.length > 1 && (
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            {assignees.map((a) => (
              <option key={a} value={a}>{a === 'ALL' ? 'Todos los asignados' : a}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className={`${col.color} rounded-lg p-3 overflow-y-auto`}>
              <h3 className="font-medium text-sm text-gray-700 mb-3 sticky top-0">
                {col.label}
                <span className="ml-1 text-xs text-gray-400">({colTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {colTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="bg-white rounded border p-3 text-sm shadow-sm animate-fade-slide hover:shadow-md transition-shadow"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <p className="font-medium text-gray-900 mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority] ?? ''}`}>
                        {task.priority}
                      </span>
                      {task.assignedTo && (
                        <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(task.dueDate).toLocaleDateString('es-MX')}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveTask(task.id, c.id)}
                          className="text-xs text-blue-600 hover:underline active:scale-95 transition-transform"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
