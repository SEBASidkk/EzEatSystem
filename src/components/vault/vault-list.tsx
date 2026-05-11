'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal, Database, CreditCard, Cloud, Box, Building2 } from 'lucide-react'
import { RevealButton } from './reveal-button'
import { DeleteCredentialButton } from './delete-credential-button'

interface Restaurant { id: string; name: string }

interface Credential {
  id: string
  name: string
  category: string
  email?: string | null
  updatedAt: Date
  restaurant?: Restaurant | null
}

const CATEGORIES = ['ALL', 'SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']

const CAT_LABEL: Record<string, string> = {
  SERVICE: 'Servicio',
  RESTAURANT: 'Restaurante',
  ACCOUNT: 'Cuenta',
  OTHER: 'Otro',
}

const CAT_ICON: Record<string, React.ReactNode> = {
  SERVICE:    <Database size={16} className="text-slate-500" />,
  RESTAURANT: <Cloud size={16} className="text-slate-500" />,
  ACCOUNT:    <CreditCard size={16} className="text-slate-500" />,
  OTHER:      <Box size={16} className="text-slate-500" />,
}

function credentialStatus(updatedAt: Date) {
  const daysOld = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld > 90) return { label: 'Alerta Admin', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: '#F59E0B' }
  return { label: 'Verificada', cls: 'bg-green-50 text-green-700 border border-green-200', dot: '#10B981' }
}

export function VaultList({ credentials, isAdmin }: { credentials: Credential[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [restaurantFilter, setRestaurantFilter] = useState('ALL')

  const restaurants = Array.from(
    new Map(
      credentials
        .filter((c) => c.restaurant)
        .map((c) => [c.restaurant!.id, c.restaurant!])
    ).values()
  )

  const filtered = credentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || c.category === category
    const matchRest = restaurantFilter === 'ALL' || c.restaurant?.id === restaurantFilter
    return matchSearch && matchCat && matchRest
  })

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-2">
        <p className="text-sm font-semibold text-slate-900">Credenciales del sistema</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todas las categorías</option>
            {CATEGORIES.filter(c => c !== 'ALL').map((c) => (
              <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>
            ))}
          </select>
          {restaurants.length > 0 && (
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los negocios</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          )}
          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar credenciales..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="border-b border-slate-100">
            <tr>
              {['Nombre', 'Categoría', 'Correo', 'Negocio', 'Valor', 'Estado', 'Último acceso', 'Acciones'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Sin credenciales.</td>
              </tr>
            ) : (
              filtered.map((c) => {
                const status = credentialStatus(c.updatedAt)
                const icon = CAT_ICON[c.category] ?? CAT_ICON.OTHER
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {icon}
                        <span className="font-medium text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600">{CAT_LABEL[c.category] ?? c.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.email ? (
                        <span className="text-xs text-slate-600">{c.email}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {c.restaurant ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-600">{c.restaurant.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-xs tracking-widest">••••••••••••</span>
                        <RevealButton credentialId={c.id} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.cls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(c.updatedAt).toLocaleString('es-MX', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {isAdmin && <DeleteCredentialButton credentialId={c.id} />}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Mostrando {filtered.length} de {credentials.length} credenciales
        </p>
      </div>
    </div>
  )
}
