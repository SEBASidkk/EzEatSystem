'use client'
import { useState } from 'react'
import { Search, SlidersHorizontal, Database, CreditCard, Cloud, Box } from 'lucide-react'
import { RevealButton } from './reveal-button'
import { DeleteCredentialButton } from './delete-credential-button'

interface Credential {
  id: string
  name: string
  category: string
  updatedAt: Date
}

const CATEGORIES = ['ALL', 'SERVICE', 'RESTAURANT', 'ACCOUNT', 'OTHER']

const ENV_MAP: Record<string, { label: string; cls: string }> = {
  SERVICE:    { label: 'Production', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  RESTAURANT: { label: 'Staging',    cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  ACCOUNT:    { label: 'Production', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  OTHER:      { label: 'Development', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const CAT_ICON: Record<string, React.ReactNode> = {
  SERVICE:    <Database size={16} className="text-slate-500" />,
  RESTAURANT: <Cloud size={16} className="text-slate-500" />,
  ACCOUNT:    <CreditCard size={16} className="text-slate-500" />,
  OTHER:      <Box size={16} className="text-slate-500" />,
}

function credentialStatus(updatedAt: Date) {
  const daysOld = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysOld > 90) return { label: 'Admin Alert', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: '#F59E0B' }
  return { label: 'Verified', cls: 'bg-green-50 text-green-700 border border-green-200', dot: '#10B981' }
}

export function VaultList({ credentials, isAdmin }: { credentials: Credential[]; isAdmin: boolean }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  const filtered = credentials.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'ALL' || c.category === category
    return matchSearch && matchCat
  })

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-900">System Credentials</p>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Environments' : ENV_MAP[c]?.label ?? c}</option>
            ))}
          </select>
          <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search credentials..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100">
          <tr>
            {['Service Name', 'Environment', 'Credential Value', 'Status', 'Last Accessed', 'Actions'].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                No credentials found.
              </td>
            </tr>
          ) : (
            filtered.map((c) => {
              const env = ENV_MAP[c.category] ?? { label: 'Development', cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
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
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${env.cls}`}>
                      {env.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-xs tracking-widest">••••••••••••••••</span>
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
                    {new Date(c.updatedAt).toLocaleString('en-US', {
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

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Showing 1–{filtered.length} of {credentials.length} credentials
        </p>
      </div>
    </div>
  )
}
