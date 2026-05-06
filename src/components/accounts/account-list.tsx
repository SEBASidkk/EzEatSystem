'use client'
import { useState, useTransition } from 'react'
import { Search, SlidersHorizontal, UserPlus, Pencil, Ban, RefreshCw, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import { toggleUserActive } from '@/actions/accounts'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  ADMIN:   { label: 'Admin',   cls: 'border border-slate-300 text-slate-700 bg-white' },
  DEV:     { label: 'Manager', cls: 'border border-slate-300 text-slate-700 bg-white' },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(name: string) {
  const colors = ['#0F172A', '#2563EB', '#0D9488', '#7C3AED', '#DC2626']
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

interface Props {
  users: User[]
  createUser: (formData: FormData) => Promise<void>
}

export function AccessControlClient({ users, createUser }: Props) {
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatus]   = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [twoFaEnabled, setTwoFa]    = useState(true)
  const [idleTimeout, setIdleTimeout] = useState('15')
  const [isPending, startTransition]  = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const filtered = users.filter((u) => {
    const matchSearch  = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole    = roleFilter === 'ALL' || u.role === roleFilter
    const matchStatus  = statusFilter === 'ALL' || (statusFilter === 'active' && u.active) || (statusFilter === 'inactive' && !u.active)
    return matchSearch && matchRole && matchStatus
  })

  function handleToggle(userId: string) {
    startTransition(async () => {
      await toggleUserActive(userId)
      toast('User updated', 'info')
      router.refresh()
    })
  }

  const suspendedCount = users.filter((u) => !u.active).length

  return (
    <div className="space-y-5">
      {/* Policy cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* 2FA */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Authentication</p>
            <ShieldCheck size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Two-Factor Auth (2FA)</p>
          <p className="text-xs text-slate-500 mb-4">Require secondary verification for all administrative roles.</p>
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Enforced Globally</span>
            <button
              onClick={() => setTwoFa(!twoFaEnabled)}
              className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none ${twoFaEnabled ? 'bg-teal-500' : 'bg-slate-300'}`}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFaEnabled ? 'translate-x-[18px]' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Session Control */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Session Control</p>
            <Clock size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Idle Timeout</p>
          <p className="text-xs text-slate-500 mb-4">Automatically terminate inactive sessions to prevent unauthorized access.</p>
          <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
            <input
              type="number"
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(e.target.value)}
              className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="120"
            />
            <span className="text-sm text-slate-500">minutes</span>
            <button className="ml-auto text-sm font-semibold text-blue-600 hover:text-blue-800">Update</button>
          </div>
        </div>

        {/* Policy Alert */}
        <div className="rounded-lg p-5 text-white" style={{ backgroundColor: '#0F172A' }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Policy Alert</p>
            <AlertTriangle size={18} className="text-blue-400" />
          </div>
          <p className="font-semibold text-white mb-1.5">Password Rotation</p>
          <p className="text-xs text-slate-400 mb-5">
            {suspendedCount > 0
              ? `${suspendedCount} account${suspendedCount !== 1 ? 's' : ''} require${suspendedCount === 1 ? 's' : ''} immediate password rotation per compliance policy.`
              : '3 Admin accounts require immediate password rotation per compliance policy.'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#2563EB' }}
          >
            Review Accounts
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-900">System Users</p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user or email..."
                className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DEV">Manager</option>
            </select>
            <button className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
              <SlidersHorizontal size={15} />
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#0F172A' }}
            >
              <UserPlus size={14} />
              Add User
            </button>
          </div>
        </div>

        {/* Add user form */}
        {showAddForm && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-3">New System User</p>
            <form
              action={async (fd) => {
                await createUser(fd)
                setShowAddForm(false)
              }}
              className="grid grid-cols-5 gap-3"
            >
              <input name="name"     placeholder="Full name"           required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="email"    type="email" placeholder="Email"  required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="password" type="password" placeholder="Password (min 8)" required minLength={8} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <select name="role" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="DEV">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#2563EB' }}>
                  Create
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {['User Identity', 'System Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">No users found.</td>
              </tr>
            ) : (
              filtered.map((user) => {
                const roleCfg = ROLE_CONFIG[user.role] ?? { label: 'Viewer', cls: 'border border-slate-300 text-slate-700 bg-white' }
                const initials = getInitials(user.name)
                const avatarBg = avatarColor(user.name)
                const statusCls = user.active
                  ? 'bg-teal-50 text-teal-700'
                  : 'bg-slate-100 text-slate-500'
                const statusLabel = user.active ? 'Active' : 'Suspended'
                const statusDot = user.active ? '#10B981' : '#94A3B8'

                return (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: avatarBg }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-[11px] text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${roleCfg.cls}`}>
                        {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCls}`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDot }} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(user.updatedAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })} UTC
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          title="Edit"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleToggle(user.id)}
                          disabled={isPending}
                          title={user.active ? 'Suspend' : 'Restore'}
                          className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                            user.active
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                          }`}
                        >
                          {user.active ? <Ban size={14} /> : <RefreshCw size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing 1 to {filtered.length} of {users.length} users
          </p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40" disabled>
              Prev
            </button>
            <button className="px-3 py-1.5 border border-slate-200 rounded-md text-xs text-slate-600 hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
