import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listTasks } from '@/actions/tasks'
import { KanbanBoard } from '@/components/tasks/kanban-board'

export default async function TasksPage() {
  const tasks = await listTasks()
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tareas</h1>
        <Link href="/tasks/new" className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          <Plus size={16} /> Nueva tarea
        </Link>
      </div>
      <KanbanBoard tasks={tasks} />
    </div>
  )
}
