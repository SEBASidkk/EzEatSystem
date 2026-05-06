'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, KeyRound, CheckSquare, Users, Store, ScrollText } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/vault', label: 'Vault', icon: KeyRound, adminOnly: false },
  { href: '/tasks', label: 'Tareas', icon: CheckSquare, adminOnly: false },
  { href: '/restaurants', label: 'Restaurantes', icon: Store, adminOnly: false },
  { href: '/accounts', label: 'Cuentas', icon: Users, adminOnly: true },
  { href: '/audit', label: 'Auditoría', icon: ScrollText, adminOnly: true },
]

interface SidebarProps { role: string }

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const items = navItems.filter((i) => !i.adminOnly || role === 'ADMIN')

  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="font-bold text-lg">EzEat System</span>
      </div>
      <nav className="flex-1 py-4">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
