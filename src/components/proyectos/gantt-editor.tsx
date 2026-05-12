'use client'
import { useState } from 'react'
import { Plus, Trash2, CalendarDays, TrendingUp } from 'lucide-react'
import { GanttChart } from './gantt-chart'
import type { GanttTask } from '@/actions/client-projects'

const PRESET_COLORS = [
  { hex: '#3B82F6', label: 'Azul' },
  { hex: '#10B981', label: 'Verde' },
  { hex: '#F59E0B', label: 'Ámbar' },
  { hex: '#8B5CF6', label: 'Violeta' },
  { hex: '#EC4899', label: 'Rosa' },
  { hex: '#0EA5E9', label: 'Cielo' },
  { hex: '#14B8A6', label: 'Teal' },
  { hex: '#F97316', label: 'Naranja' },
  { hex: '#EF4444', label: 'Rojo' },
  { hex: '#64748B', label: 'Pizarra' },
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
    color:    PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]?.hex ?? '#3B82F6',
  }
}

function progressColor(pct: number) {
  if (pct >= 80) return '#10B981'
  if (pct >= 40) return '#3B82F6'
  return '#0F172A'
}

export function GanttEditor({ tasks, onChange }: Props) {
  const [preview, setPreview] = useState(false)

  function add()    { onChange([...tasks, newTask()]) }
  function update(id: string, patch: Partial<GanttTask>) {
    onChange(tasks.map(t => t.id === id ? { ...t, ...patch } : t))
  }
  function remove(id: string) { onChange(tasks.filter(t => t.id !== id)) }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Gráfica Gantt</p>
            <p className="text-xs text-slate-400">{tasks.length} tarea{tasks.length !== 1 ? 's' : ''} definida{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreview(v => !v)}
            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors cursor-pointer"
          >
            {preview ? '← Editar tareas' : 'Vista previa →'}
          </button>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={13} /> Agregar tarea
          </button>
        </div>
      </div>

      {/* Content */}
      {preview ? (
        <div className="p-6">
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Sin tareas para mostrar en el diagrama.</p>
          ) : (
            <GanttChart tasks={tasks} />
          )}
        </div>
      ) : (
        <>
          {tasks.length === 0 && (
            <div className="px-6 py-12 text-center">
              <CalendarDays size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-400">Sin tareas en el diagrama</p>
              <p className="text-xs text-slate-300 mt-1">Agrega la primera tarea con el botón de arriba</p>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {tasks.map((task, idx) => (
              <div key={task.id} className="p-6 space-y-5">

                {/* Row 1: Number + Color strip + Name + Delete */}
                <div className="flex items-start gap-4">
                  {/* Task number badge */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: task.color }}
                  >
                    {idx + 1}
                  </div>

                  {/* Name input */}
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Nombre de la tarea
                    </label>
                    <input
                      required
                      value={task.name}
                      onChange={e => update(task.id, { name: e.target.value })}
                      placeholder="Ej. Diseño de interfaz, Integración API, Pruebas UAT…"
                      className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        placeholder:text-slate-300 transition-shadow"
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => remove(task.id)}
                    className="flex-shrink-0 mt-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar tarea"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Row 2: Color picker */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Color de barra</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(({ hex, label }) => (
                      <button
                        key={hex}
                        type="button"
                        title={label}
                        onClick={() => update(task.id, { color: hex })}
                        className={`w-7 h-7 rounded-lg transition-all cursor-pointer border-2 ${
                          task.color === hex
                            ? 'scale-110 border-slate-700 shadow-md'
                            : 'border-transparent hover:scale-105 hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Row 3: Dates side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 block">
                      <CalendarDays size={11} /> Fecha de inicio
                    </label>
                    <input
                      type="date"
                      value={task.start}
                      onChange={e => update(task.id, { start: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 block">
                      <CalendarDays size={11} /> Fecha de fin
                    </label>
                    <input
                      type="date"
                      value={task.end}
                      onChange={e => update(task.id, { end: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    />
                  </div>
                </div>

                {/* Row 4: Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp size={11} /> Avance
                    </label>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: progressColor(task.progress) }}
                    >
                      {task.progress}%
                    </span>
                  </div>
                  {/* Visual progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: progressColor(task.progress),
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={task.progress}
                    onChange={e => update(task.id, { progress: Number(e.target.value) })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: progressColor(task.progress) }}
                  />
                  {/* Step markers */}
                  <div className="flex justify-between mt-1">
                    {[0, 25, 50, 75, 100].map(v => (
                      <span key={v} className="text-[10px] text-slate-300 tabular-nums">{v}%</span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

          {tasks.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={add}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
              >
                <Plus size={15} /> Agregar otra tarea
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
