import { auth, signOut } from '@/lib/auth'
import { Lock, Settings, Search } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from './header-notifications'

function getInitials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export async function Header() {
  const session = await auth()
  const user = session?.user as { name?: string; role?: string } | undefined
  const initials = getInitials(user?.name)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3 lg:gap-4 min-w-0">
        <span className="font-bold text-slate-900 text-base tracking-tight hidden lg:block">Ez-eat</span>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Buscar..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-44 lg:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title="Bloquear sesión"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Lock size={18} />
          </button>
        </form>
        <Link
          href="/settings"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors"
          title="Configuración"
        >
          <Settings size={18} />
        </Link>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title={`${user?.name ?? 'Usuario'} — clic para cerrar sesión`}
            className="w-8 h-8 rounded-full text-white text-xs font-bold ml-1 hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{ backgroundColor: '#0F172A' }}
          >
            {initials}
          </button>
        </form>
      </div>
    </header>
  )
}
