import { redirect } from 'next/navigation'
import { createTask } from '@/actions/tasks'
import { prisma } from '@/lib/db'

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } })

  async function handleCreate(formData: FormData) {
    'use server'
    await createTask(formData)
    redirect('/tasks')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Tarea</h1>
      <form action={handleCreate} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input name="title" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
          <select name="priority" className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
          <select name="assignedToId" className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Sin asignar</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          Crear tarea
        </button>
      </form>
    </div>
  )
}
