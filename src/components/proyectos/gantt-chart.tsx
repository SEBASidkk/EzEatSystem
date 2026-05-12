'use client'
import type { GanttTask } from '@/actions/client-projects'

interface Props {
  tasks: GanttTask[]
}

// ─── helpers ────────────────────────────────────────────────────────────────

function parseDate(s: string) { return new Date(s + 'T00:00:00') }

function daysBetween(a: Date, b: Date) {
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86_400_000))
}

function toLeft(date: Date, minDate: Date, totalDays: number) {
  const off = Math.max(0, (date.getTime() - minDate.getTime()) / 86_400_000)
  return (off / totalDays) * 100
}

function toWidth(startDate: Date, endDate: Date, minDate: Date, totalDays: number) {
  const left  = toLeft(startDate, minDate, totalDays)
  const right = toLeft(endDate,   minDate, totalDays)
  return Math.max(0.4, right - left)
}

function monthLabels(start: Date, totalDays: number) {
  const labels: { label: string; left: number; width: number }[] = []
  const cursor = new Date(start)
  cursor.setDate(1)
  const rangeEnd = new Date(start.getTime() + totalDays * 86_400_000)

  while (cursor <= rangeEnd) {
    const monthStart = new Date(cursor)
    const monthEnd   = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const startOff   = Math.max(0, (monthStart.getTime() - start.getTime()) / 86_400_000)
    const endOff     = Math.min(totalDays, (monthEnd.getTime() - start.getTime()) / 86_400_000)
    const w          = endOff - startOff
    if (w > 0) {
      labels.push({
        label: cursor.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
        left:  (startOff / totalDays) * 100,
        width: (w / totalDays) * 100,
      })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return labels
}

// ─── status config ──────────────────────────────────────────────────────────

const STATUS_CFG = {
  no_iniciado: { dot: '#94A3B8', label: 'No iniciado' },
  en_progreso: { dot: '#3B82F6', label: 'En progreso' },
  completado:  { dot: '#10B981', label: 'Completado'  },
  bloqueado:   { dot: '#EF4444', label: 'Bloqueado'   },
} satisfies Record<string, { dot: string; label: string }>

const PRIORITY_CFG = {
  baja:   { label: 'B', bg: '#F1F5F9', text: '#64748B' },
  media:  { label: 'M', bg: '#EFF6FF', text: '#3B82F6' },
  alta:   { label: 'A', bg: '#FFFBEB', text: '#F59E0B' },
  critica:{ label: '!', bg: '#FEF2F2', text: '#EF4444' },
} satisfies Record<string, { label: string; bg: string; text: string }>

// ─── component ──────────────────────────────────────────────────────────────

const LABEL_W = 176 // px — left column width

export function GanttChart({ tasks }: Props) {
  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-24 text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Sin tareas en la gráfica de Gantt
      </div>
    )
  }

  // Build date range from planned + actual dates
  const allDates: Date[] = []
  tasks.forEach(t => {
    allDates.push(parseDate(t.start), parseDate(t.end))
    if (t.actualStart) allDates.push(parseDate(t.actualStart))
    if (t.actualEnd)   allDates.push(parseDate(t.actualEnd))
  })
  const minDate    = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate    = new Date(Math.max(...allDates.map(d => d.getTime())))
  // Add 2-day padding on each side
  minDate.setDate(minDate.getDate() - 2)
  maxDate.setDate(maxDate.getDate() + 2)
  const totalDays  = daysBetween(minDate, maxDate)
  const labels     = monthLabels(minDate, totalDays)

  // Today position
  const today       = new Date()
  const showToday   = today >= minDate && today <= maxDate
  const todayLeft   = toLeft(today, minDate, totalDays)

  // Variance summary
  const hasDual = tasks.some(t => t.actualStart && t.actualEnd)

  return (
    <div className="space-y-4">

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-8 rounded-full bg-slate-300 opacity-60" />
          <span className="text-xs text-slate-500">Tiempo planificado</span>
        </div>
        {hasDual && (
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-8 rounded-full bg-blue-500" />
            <span className="text-xs text-slate-500">Tiempo real</span>
          </div>
        )}
        {showToday && (
          <div className="flex items-center gap-2">
            <div className="h-4 border-l-2 border-red-400 border-dashed w-px" />
            <span className="text-xs text-slate-500">Hoy</span>
          </div>
        )}
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.dot }} />
            <span className="text-[10px] text-slate-400">{v.label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <div style={{ minWidth: `${LABEL_W + 600}px` }}>

          {/* Month header */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            <div style={{ width: LABEL_W }} className="shrink-0 px-3 py-2 border-r border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Tarea</span>
            </div>
            <div className="relative flex-1 h-8">
              {labels.map((l, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 flex items-center px-2 border-r border-slate-100"
                  style={{ left: `${l.left}%`, width: `${l.width}%` }}
                >
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest truncate">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasks.map((task, idx) => {
            const plannedStart = parseDate(task.start)
            const plannedEnd   = parseDate(task.end)
            const actualStart  = task.actualStart ? parseDate(task.actualStart) : null
            const actualEnd    = task.actualEnd   ? parseDate(task.actualEnd)   : null

            const pLeft  = toLeft(plannedStart, minDate, totalDays)
            const pWidth = toWidth(plannedStart, plannedEnd, minDate, totalDays)

            const aLeft  = actualStart ? toLeft(actualStart, minDate, totalDays)  : null
            const aWidth = (actualStart && actualEnd) ? toWidth(actualStart, actualEnd, minDate, totalDays) : null

            // Variance in days
            const variance = (actualEnd && actualStart)
              ? Math.round((actualEnd.getTime() - plannedEnd.getTime()) / 86_400_000)
              : null

            const statusCfg   = STATUS_CFG[task.status] ?? STATUS_CFG.no_iniciado
            const priorityCfg = task.priority ? PRIORITY_CFG[task.priority] : null

            const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'

            return (
              <div key={task.id} className={`flex border-b border-slate-50 ${rowBg} hover:bg-blue-50/20 transition-colors group`}>
                {/* Label column */}
                <div
                  style={{ width: LABEL_W }}
                  className="shrink-0 px-3 py-3 border-r border-slate-100 flex flex-col gap-1 justify-center"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {task.milestone && (
                      <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
                        <polygon points="5,0 10,5 5,10 0,5" fill={task.color} />
                      </svg>
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: statusCfg.dot }}
                    />
                    <span className="text-xs text-slate-700 font-medium truncate">{task.name || `Tarea ${idx + 1}`}</span>
                    {priorityCfg && (
                      <span
                        className="shrink-0 text-[9px] font-bold px-1 rounded"
                        style={{ backgroundColor: priorityCfg.bg, color: priorityCfg.text }}
                      >
                        {priorityCfg.label}
                      </span>
                    )}
                  </div>
                  {task.assignee && (
                    <span className="text-[10px] text-slate-400 truncate pl-3.5">{task.assignee}</span>
                  )}
                  {variance !== null && (
                    <span
                      className="text-[9px] font-semibold pl-3.5"
                      style={{ color: variance > 0 ? '#EF4444' : variance < 0 ? '#10B981' : '#64748B' }}
                    >
                      {variance > 0 ? `+${variance}d retraso` : variance < 0 ? `${Math.abs(variance)}d adelanto` : 'En tiempo'}
                    </span>
                  )}
                </div>

                {/* Timeline track */}
                <div className="relative flex-1 py-3" style={{ minHeight: '56px' }}>
                  {/* Grid lines */}
                  {labels.map((l, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 border-r border-slate-100"
                      style={{ left: `${l.left + l.width}%` }}
                    />
                  ))}

                  {/* Today line */}
                  {showToday && (
                    <div
                      className="absolute inset-y-0 border-l-2 border-red-400 border-dashed pointer-events-none z-10"
                      style={{ left: `${todayLeft}%` }}
                    />
                  )}

                  {/* Planned bar (ghost) */}
                  {task.milestone ? (
                    /* Milestone diamond */
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `calc(${pLeft}% - 8px)` }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <polygon points="8,1 15,8 8,15 1,8" fill={task.color} stroke="white" strokeWidth="1.5" />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="absolute rounded-full"
                      style={{
                        left: `${pLeft}%`,
                        width: `${pWidth}%`,
                        top: aLeft !== null ? '6px' : '50%',
                        height: '8px',
                        transform: aLeft !== null ? 'none' : 'translateY(-50%)',
                        backgroundColor: task.color,
                        opacity: 0.25,
                      }}
                    />
                  )}

                  {/* Actual bar (solid with progress fill) */}
                  {aLeft !== null && aWidth !== null && !task.milestone && (
                    <div
                      className="absolute rounded-full overflow-hidden"
                      style={{
                        left:   `${aLeft}%`,
                        width:  `${aWidth}%`,
                        bottom: '6px',
                        height: '14px',
                        backgroundColor: `${task.color}33`,
                      }}
                    >
                      {/* Progress fill */}
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${task.progress}%`,
                          backgroundColor: task.color,
                        }}
                      />
                      {/* Progress text */}
                      {aWidth > 6 && (
                        <div className="absolute inset-0 flex items-center px-1.5">
                          <span className="text-[9px] font-bold text-white drop-shadow-sm">
                            {task.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If no actual, show progress on planned bar */}
                  {aLeft === null && !task.milestone && (
                    <>
                      {/* Re-render planned bar opaque with progress */}
                      <div
                        className="absolute rounded-full overflow-hidden"
                        style={{
                          left:      `${pLeft}%`,
                          width:     `${pWidth}%`,
                          top:       '50%',
                          height:    '14px',
                          transform: 'translateY(-50%)',
                          backgroundColor: `${task.color}33`,
                        }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${task.progress}%`, backgroundColor: task.color }}
                        />
                        {pWidth > 6 && (
                          <div className="absolute inset-0 flex items-center px-1.5">
                            <span className="text-[9px] font-bold text-white drop-shadow-sm">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {/* Bottom summary row */}
          <div className="flex bg-slate-50 border-t border-slate-100 px-3 py-2">
            <div style={{ width: LABEL_W }} className="shrink-0">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                {tasks.length} tarea{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-4 px-2">
              <span className="text-[10px] text-slate-400">
                Completadas: <strong className="text-slate-600">{tasks.filter(t => t.status === 'completado').length}</strong>
              </span>
              <span className="text-[10px] text-slate-400">
                Bloqueadas: <strong className="text-red-500">{tasks.filter(t => t.status === 'bloqueado').length}</strong>
              </span>
              <span className="text-[10px] text-slate-400">
                Avance promedio: <strong className="text-slate-600">
                  {tasks.length ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0}%
                </strong>
              </span>
              {hasDual && (
                <span className="text-[10px] text-slate-400">
                  Con retraso: <strong className="text-red-500">
                    {tasks.filter(t => {
                      if (!t.actualEnd) return false
                      return parseDate(t.actualEnd) > parseDate(t.end)
                    }).length}
                  </strong>
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
