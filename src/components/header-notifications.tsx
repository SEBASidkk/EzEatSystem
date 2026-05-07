'use client'
import { useState, useTransition, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { getNotifications, type Notification } from '@/actions/notifications'

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  return `hace ${Math.floor(hrs / 24)}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && notifications.length === 0) {
      startTransition(async () => {
        const data = await getNotifications()
        setNotifications(data)
      })
    }
  }, [open, notifications.length])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Actividad reciente</p>
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">Sistema</span>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400 text-center">Sin actividad reciente</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-medium text-slate-800">{n.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.userName} — {n.resourceType}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
