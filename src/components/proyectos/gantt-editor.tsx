'use client'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { GanttChart } from './gantt-chart'
import type { GanttTask } from '@/actions/client-projects'

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#0EA5E9', '#14B8A6', '#F97316',
]

interface Props {
  tasks: GanttTask[]
  onChange: (tasks: GanttTask[]) => void
}

function newTask(): GanttTask {
  const today = new Date().toISOString().substring(0, 10) as string
  const end   = new Date(Date.now() + 14 * 86_400_000).toISOString().substring(0, 10) as string
  return {
    id:       crypto.randomUUID(),
    name:     '',
    start:    today,
    end,
    progress: 0,
    color:    PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] ?? '#3B82F6',
  }
}

export function GanttEditor({ tasks, onChange }: Props) {
  const [preview, setPreview] = useState(false)

  function add() { onChange([...tasks, newTask()]) }

  function update(id: string, patch: Partial<GanttTask>) {
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  function remove(id: string) { onChange(tasks.filter(t => t.id !== id)) }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest">Gráfica Gantt</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
          >
            {preview ? 'Editar' : 'Vista previa'}
          </button>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <Plus size={13} /> Agregar tarea
          </button>
        </div>
      </div>

      {preview ? (
        <div className="p-5">
          <GanttChart tasks={tasks} />
        </div>
      ) : (
        <>
          {tasks.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-400 text-center">Sin tareas — agrega una arriba</p>
          )}
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="px-5 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Color picker */}
                  <div className="flex gap-1 shrink-0">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update(task.id, { color: c })}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${task.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    required
                    value={task.name}
                    onChange={e => update(task.id, { name: e.target.value })}
                    placeholder="Nombre de la tarea"
                    className="flex-1 text-sm text-slate-900 bg-transparent border-0 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => remove(task.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Inicio</label>
                    <input
                      type="date"
                      value={task.start}
                      onChange={e => update(task.id, { start: e.target.value })}
                      className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fin</label>
                    <input
                      type="date"
                      value={task.end}
                      onChange={e => update(task.id, { end: e.target.value })}
                      className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Avance</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={task.progress}
                      onChange={e => update(task.id, { progress: Number(e.target.value) })}
                      className="flex-1 accent-slate-800"
                    />
                    <span className="text-xs font-semibold text-slate-600 w-9 text-right">{task.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
