'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { CredentialCard } from './credential-card'

interface Credential {
  id: string
  name: string
  category: string
  updatedAt: Date
}

const CATEGORIES = ['ALL', 'SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']

export function VaultList({ credentials, isAdmin }: { credentials: Credential[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const filtered = credentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || c.category === category
    return matchSearch && matchCat
  })

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar credencial..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'ALL' ? 'Todas las categorías' : c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin resultados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <div key={c.id} style={{ animationDelay: `${i * 30}ms` }}>
              <CredentialCard id={c.id} name={c.name} category={c.category} updatedAt={c.updatedAt} isAdmin={isAdmin} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
