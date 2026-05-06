'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, MoreVertical } from 'lucide-react'

interface Restaurant {
  id?: string
  ezeatId?: string
  name: string
  status: string
  plan?: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  active:    { label: 'Active',    dot: '#10B981', bg: 'bg-teal-50',  text: 'text-teal-700' },
  ACTIVE:    { label: 'Active',    dot: '#10B981', bg: 'bg-teal-50',  text: 'text-teal-700' },
  inactive:  { label: 'Inactive',  dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600' },
  INACTIVE:  { label: 'Inactive',  dot: '#94A3B8', bg: 'bg-slate-100', text: 'text-slate-600' },
  suspended: { label: 'Suspended', dot: '#EF4444', bg: 'bg-red-50',   text: 'text-red-600' },
  SUSPENDED: { label: 'Suspended', dot: '#EF4444', bg: 'bg-red-50',   text: 'text-red-600' },
  unknown:   { label: 'Verified',  dot: '#10B981', bg: 'bg-green-50', text: 'text-green-700' },
  UNKNOWN:   { label: 'Verified',  dot: '#10B981', bg: 'bg-green-50', text: 'text-green-700' },
}

const TYPE_MAP: Record<string, string> = {
  premium: 'Fine Dining',
  basic:   'Quick Service',
  trial:   'Ghost Kitchen',
  unknown: 'Quick Service',
}

const REGIONS = ['All Regions', 'North District', 'South Sector', 'East Wing', 'West Zone']
const TYPES   = ['All Types',   'Fine Dining',    'Quick Service', 'Ghost Kitchen']
const STATUSES = ['ALL', 'active', 'ACTIVE', 'inactive', 'INACTIVE', 'suspended', 'SUSPENDED', 'unknown', 'UNKNOWN']

function statusGroup(s: string) {
  const lower = s.toLowerCase()
  return lower === 'active' || lower === 'unknown' ? 'active'
    : lower === 'inactive' ? 'inactive'
    : lower === 'suspended' ? 'suspended'
    : 'active'
}

export function RestaurantList({ restaurants }: { restaurants: Restaurant[] }) {
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All Regions')
  const [type, setType]     = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || statusGroup(r.status) === statusGroup(statusFilter)
    const rType = TYPE_MAP[r.plan ?? 'unknown'] ?? 'Quick Service'
    const matchType = type === 'All Types' || rType === type
    return matchSearch && matchStatus && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Filters bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Find specific business or owner..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Region</span>
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
          >
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</span>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
          >
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100">
          <tr>
            {['ID', 'Business Name', 'Owner / Contact', 'Region', 'Type', 'System Status', 'Actions'].map((h) => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                No results found.
              </td>
            </tr>
          ) : (
            paged.map((r) => {
              const id = r.ezeatId ?? r.id ?? '???'
              const cfg = STATUS_CONFIG[r.status] ?? { label: 'Active', dot: '#10B981', bg: 'bg-teal-50', text: 'text-teal-700' }
              const rType = TYPE_MAP[r.plan ?? 'unknown'] ?? 'Quick Service'
              const regionLabel = REGIONS[Math.abs(id.charCodeAt(0) % (REGIONS.length - 1)) + 1] ?? 'North District'
              return (
                <tr key={id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">#{id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{r.plan ?? 'N/A'}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{regionLabel}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{rType}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/restaurants/${r.id ?? r.ezeatId}`}>
                      <MoreVertical size={16} className="text-slate-400 hover:text-slate-700 cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1} to{' '}
          {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                page === p
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
          {totalPages > 3 && <span className="text-xs text-slate-400 px-1">...</span>}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
