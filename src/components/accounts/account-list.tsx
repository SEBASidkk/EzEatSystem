'use client'
import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { toggleUserActive } from '@/actions/accounts'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export function AccountList({ users }: { users: User[] }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = role === 'ALL' || u.role === role
    const matchActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'active' && u.active) ||
      (activeFilter === 'inactive' && !u.active)
    return matchSearch && matchRole && matchActive
  })

  function handleToggle(userId: string) {
    startTransition(async () => {
      await toggleUserActive(userId)
      toast('Usuario actualizado', 'info')
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DEV">Dev</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="ALL">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-gray-500 text-sm">Sin resultados.</p>
        )}
        {filtered.map((user, i) => (
          <div
            key={user.id}
            className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between animate-fade-slide"
            style={{ animationDelay: `${i * 20}ms` }}
          >
            <div>
              <p className="font-medium text-sm text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
            </div>
            <button
              onClick={() => handleToggle(user.id)}
              disabled={isPending}
              className={`text-xs px-2 py-1 rounded font-medium active:scale-95 transition-transform disabled:opacity-50 ${
                user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {user.active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
