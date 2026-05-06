import { auth, signOut } from '@/lib/auth'
import { Bell, Lock, Settings, Search } from 'lucide-react'

function getInitials(name?: string) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export async function Header() {
  const session = await auth()
  const user = session?.user as { name?: string; role?: string } | undefined
  const initials = getInitials(user?.name)

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-bold text-slate-900 text-base tracking-tight">Ez-eat</span>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search resources..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
          <Lock size={18} />
        </button>
        <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors">
          <Settings size={18} />
        </button>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            title={`${user?.name ?? 'User'} — click to sign out`}
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
