'use client'
import type { GanttTask } from '@/actions/client-projects'

interface Props {
  tasks: GanttTask[]
}

function parseDate(s: string) { return new Date(s + 'T00:00:00') }

function daysBetween(a: Date, b: Date) {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86_400_000))
}

function monthLabels(start: Date, totalDays: number) {
  const labels: { label: string; left: number; width: number }[] = []
  const cursor = new Date(start)
  cursor.setDate(1)

  while (cursor <= new Date(start.getTime() + totalDays * 86_400_000)) {
    const monthStart = new Date(cursor)
    const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)

    const startOff = Math.max(0, daysBetween(start, monthStart) - 1)
    const endOff   = Math.min(totalDays, daysBetween(start, monthEnd))
    const width    = endOff - startOff

    if (width > 0) {
      labels.push({
        label: cursor.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        left: (startOff / totalDays) * 100,
        width: (width / totalDays) * 100,
      })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return labels
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6', '#F97316']

export function GanttChart({ tasks }: Props) {
  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Sin tareas en la gráfica de Gantt
      </div>
    )
  }

  const allDates = tasks.flatMap(t => [parseDate(t.start), parseDate(t.end)])
  const minDate  = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate  = new Date(Math.max(...allDates.map(d => d.getTime())))
  const totalDays = daysBetween(minDate, maxDate) + 1
  const labels    = monthLabels(minDate, totalDays)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: '600px' }}>
        {/* Month header */}
        <div className="relative h-7 mb-1">
          {labels.map((l, i) => (
            <div
              key={i}
              className="absolute top-0 h-full flex items-center px-2 border-r border-slate-100"
              style={{ left: `${l.left}%`, width: `${l.width}%` }}
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest truncate">
                {l.label}
              </span>
            </div>
          ))}
        </div>

        {/* Grid + bars */}
        <div className="relative space-y-2">
          {/* Vertical grid lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {labels.map((l, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-r border-slate-100"
                style={{ left: `${l.left + l.width}%` }}
              />
            ))}
          </div>

          {tasks.map((task, i) => {
            const taskStart = parseDate(task.start)
            const taskEnd   = parseDate(task.end)
            const leftDays  = daysBetween(minDate, taskStart) - 1
            const widthDays = daysBetween(taskStart, taskEnd) + 1
            const left      = Math.max(0, (leftDays / totalDays) * 100)
            const width     = Math.min(100 - left, (widthDays / totalDays) * 100)
            const color     = task.color || COLORS[i % COLORS.length]

            return (
              <div key={task.id} className="flex items-center gap-3 h-9">
                {/* Task name */}
                <div className="w-36 shrink-0 text-xs text-slate-600 font-medium truncate text-right pr-2">
                  {task.name}
                </div>

                {/* Bar track */}
                <div className="relative flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 h-full rounded-full opacity-20"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color }}
                  />
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${width * (task.progress / 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                  <div
                    className="absolute top-0 h-full flex items-center px-2"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {width > 8 && (
                      <span className="text-[10px] font-semibold text-white drop-shadow-sm truncate">
                        {task.progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Today marker */}
        {(() => {
          const today = new Date()
          if (today >= minDate && today <= maxDate) {
            const todayLeft = (daysBetween(minDate, today) / totalDays) * 100
            return (
              <div
                className="absolute top-7 bottom-0 border-l-2 border-red-400 border-dashed pointer-events-none"
                style={{ left: `calc(144px + ${todayLeft}% * (100% - 144px) / 100)` }}
              />
            )
          }
        })()}
      </div>
    </div>
  )
}
