'use client'
import { updateTaskStatus } from '@/actions/tasks'
import { useTransition } from 'react'

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

interface Task {
  id: string
  title: string
  priority: string
  status: string
  assignedTo: { name: string } | null
  dueDate: Date | null
}

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [, startTransition] = useTransition()

  function moveTask(taskId: string, status: string) {
    startTransition(() => updateTaskStatus(taskId, status))
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {COLUMNS.map((col) => (
        <div key={col.id} className={`${col.color} rounded-lg p-3`}>
          <h3 className="font-medium text-sm text-gray-700 mb-3">
            {col.label}
            <span className="ml-1 text-xs text-gray-400">
              ({tasks.filter((t) => t.status === col.id).length})
            </span>
          </h3>
          <div className="space-y-2">
            {tasks
              .filter((t) => t.status === col.id)
              .map((task) => (
                <div key={task.id} className="bg-white rounded border p-3 text-sm shadow-sm">
                  <p className="font-medium text-gray-900 mb-2">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority] ?? ''}`}>
                      {task.priority}
                    </span>
                    {task.assignedTo && (
                      <span className="text-xs text-gray-500">{task.assignedTo.name}</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => moveTask(task.id, c.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
