'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users2,
  KeyRound,
  ClipboardCheck,
  ShieldCheck,
  HelpCircle,
  History,
  Plus,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/restaurants', label: 'Affiliate Management', icon: Users2, adminOnly: false },
  { href: '/vault', label: 'Credential Vault', icon: KeyRound, adminOnly: false },
  { href: '/tasks', label: 'Task Manager', icon: ClipboardCheck, adminOnly: false },
  { href: '/accounts', label: 'Access Control', icon: ShieldCheck, adminOnly: true },
]

const bottomItems = [
  { href: '/audit', label: 'Logs', icon: History, adminOnly: true },
]

interface SidebarProps { role: string }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'ADMIN'
  const visibleNav = navItems.filter((i) => !i.adminOnly || isAdmin)
  const visibleBottom = bottomItems.filter((i) => !i.adminOnly || isAdmin)

  return (
    <aside className="w-60 flex flex-col min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Ez-eat Admin</p>
            <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase mt-0.5">
              Secure System
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium tracking-wide uppercase transition-all ${
                  active
                    ? 'bg-slate-700/70 text-white border-l-2 border-blue-500 pl-[10px]'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-slate-700/50 pt-3">
        <div className="space-y-0.5 mb-3">
          {visibleBottom.map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium uppercase tracking-wide transition-all ${
                  active ? 'text-white bg-slate-700/70' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/audit"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <HelpCircle size={14} />
            Support
          </Link>
        </div>
        <Link
          href="/tasks/new"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-medium text-white transition-colors hover:bg-slate-600"
          style={{ backgroundColor: '#1e293b' }}
        >
          <Plus size={15} />
          New Request
        </Link>
      </div>
    </aside>
  )
}
