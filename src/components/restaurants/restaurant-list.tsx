'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Restaurant {
  id?: string
  ezeatId?: string
  name: string
  status: string
  plan?: string
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  unknown: 'bg-yellow-100 text-yellow-700',
}

const STATUSES = ['ALL', 'active', 'inactive', 'suspended', 'unknown']

export function RestaurantList({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const plans = ['ALL', ...Array.from(new Set(restaurants.map((r) => r.plan ?? 'unknown')))]
  const [plan, setPlan] = useState('ALL')

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'ALL' || r.status === status
    const matchPlan = plan === 'ALL' || (r.plan ?? 'unknown') === plan
    return matchSearch && matchStatus && matchPlan
  })

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar restaurante..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'Todos los status' : s}</option>
          ))}
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {plans.map((p) => (
            <option key={p} value={p}>{p === 'ALL' ? 'Todos los planes' : p}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-400 mb-2">{filtered.length} restaurante{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin resultados.</p>
      ) : (
        <div className="bg-white border rounded-lg divide-y">
          {filtered.map((r, i) => (
            <Link
              key={r.id ?? r.ezeatId}
              href={`/restaurants/${r.id ?? r.ezeatId}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 animate-fade-slide transition-colors"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div>
                <span className="font-medium text-sm text-gray-900">{r.name}</span>
                {r.plan && r.plan !== 'unknown' && (
                  <span className="ml-2 text-xs text-gray-400">{r.plan}</span>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? STATUS_COLOR.unknown}`}>
                {r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
