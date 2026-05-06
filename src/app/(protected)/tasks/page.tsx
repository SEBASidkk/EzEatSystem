import Link from 'next/link'
import { Plus, ShieldCheck } from 'lucide-react'
import { listTasks } from '@/actions/tasks'
import { KanbanBoard } from '@/components/tasks/kanban-board'

export default async function TasksPage() {
  const tasks = await listTasks()
  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operational Task Matrix</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage, assign, and track internal administrative protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-blue-200 rounded-lg bg-blue-50">
            <ShieldCheck size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Level 4 Encrypted</span>
          </div>
          <Link
            href="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#0F172A' }}
          >
            <Plus size={15} />
            New Task
          </Link>
        </div>
      </div>
      <KanbanBoard tasks={tasks} />
    </div>
  )
}
