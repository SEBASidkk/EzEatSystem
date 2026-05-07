'use client'
import { useState, useTransition } from 'react'
import { Search, UserPlus, Pencil, Ban, RefreshCw, ShieldCheck, Clock, AlertTriangle, X, Save, QrCode, Check } from 'lucide-react'
import { toggleUserActive, updateUser, setup2FA, confirm2FA, disable2FA, updateSystemSetting } from '@/actions/accounts'
import { useToast } from '@/lib/toast-context'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  twoFactorEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: 'Admin',         cls: 'border border-slate-300 text-slate-700 bg-white' },
  DEV:   { label: 'Desarrollador', cls: 'border border-slate-300 text-slate-700 bg-white' },
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(name: string) {
  const colors = ['#0F172A', '#2563EB', '#0D9488', '#7C3AED', '#DC2626']
  return colors[name.charCodeAt(0) % colors.length]
}

interface Props {
  users: User[]
  createUser: (formData: FormData) => Promise<void>
  idleTimeoutMinutes: string
}

export function AccessControlClient({ users, createUser, idleTimeoutMinutes }: Props) {
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('ALL')
  const [statusFilter, setStatus]     = useState('ALL')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editUser, setEditUser]       = useState<User | null>(null)
  const [twoFaUser, setTwoFaUser]     = useState<User | null>(null)
  const [qrData, setQrData]           = useState<{ qrDataUrl: string; secret: string } | null>(null)
  const [totpCode, setTotpCode]       = useState('')
  const [idleTimeout, setIdleTimeout] = useState(idleTimeoutMinutes)
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
      toast('Usuario actualizado', 'info')
      router.refresh()
    })
  }

  function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editUser) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateUser(editUser.id, fd)
      toast('Usuario actualizado', 'success')
      setEditUser(null)
      router.refresh()
    })
  }

  function handleSetup2FA(user: User) {
    setTwoFaUser(user)
    setQrData(null)
    setTotpCode('')
    startTransition(async () => {
      const data = await setup2FA(user.id)
      setQrData(data)
    })
  }

  function handleConfirm2FA() {
    if (!twoFaUser) return
    startTransition(async () => {
      const result = await confirm2FA(twoFaUser.id, totpCode)
      if (result.success) {
        toast('2FA activado correctamente', 'success')
        setTwoFaUser(null)
        setQrData(null)
        router.refresh()
      } else {
        toast('Código inválido, intenta de nuevo', 'error')
      }
    })
  }

  function handleDisable2FA(userId: string) {
    startTransition(async () => {
      await disable2FA(userId)
      toast('2FA desactivado', 'info')
      router.refresh()
    })
  }

  function handleSaveIdleTimeout() {
    startTransition(async () => {
      await updateSystemSetting('idle_timeout_minutes', idleTimeout)
      toast('Timeout actualizado', 'success')
    })
  }

  const suspendedCount = users.filter((u) => !u.active).length

  return (
    <div className="space-y-5">
      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Editar usuario</p>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Nombre</label>
                <input name="name" defaultValue={editUser.name} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Correo</label>
                <input name="email" type="email" defaultValue={editUser.email} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Rol</label>
                <select name="role" defaultValue={editUser.role} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="DEV">Desarrollador</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                  <Save size={14} />
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditUser(null)} className="px-4 py-2.5 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA setup modal */}
      {twoFaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Configurar 2FA — {twoFaUser.name}</p>
              <button onClick={() => setTwoFaUser(null)} className="text-slate-400 hover:text-slate-700 rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {!qrData ? (
                <p className="text-sm text-slate-500 text-center py-4">Generando código QR...</p>
              ) : (
                <>
                  <p className="text-xs text-slate-600">Escanea el código QR con Google Authenticator o Authy, luego ingresa el código de 6 dígitos para confirmar.</p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrData.qrDataUrl} alt="QR 2FA" className="w-48 h-48 rounded-lg border border-slate-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Código de verificación</label>
                    <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={(e) => setTotpCode(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="000000" />
                  </div>
                  <button onClick={handleConfirm2FA} disabled={isPending || totpCode.length !== 6} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors">
                    <Check size={14} />
                    {isPending ? 'Verificando...' : 'Activar 2FA'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Policy cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Autenticación</p>
            <ShieldCheck size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Autenticación de Dos Factores</p>
          <p className="text-xs text-slate-500 mb-4">Configura 2FA por usuario desde la tabla de abajo.</p>
          <div className="border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-blue-600">
              {users.filter(u => u.twoFactorEnabled).length}/{users.length} usuarios con 2FA activo
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Control de Sesión</p>
            <Clock size={18} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-900 mb-1.5">Tiempo de Inactividad</p>
          <p className="text-xs text-slate-500 mb-4">Terminar sesiones inactivas automáticamente.</p>
          <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
            <input type="number" value={idleTimeout} onChange={(e) => setIdleTimeout(e.target.value)} className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" max="1440" />
            <span className="text-sm text-slate-500">minutos</span>
            <button onClick={handleSaveIdleTimeout} disabled={isPending} className="ml-auto text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50">Guardar</button>
          </div>
        </div>

        <div className="rounded-lg p-5 text-white" style={{ backgroundColor: '#0F172A' }}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alerta de Política</p>
            <AlertTriangle size={18} className="text-blue-400" />
          </div>
          <p className="font-semibold text-white mb-1.5">Rotación de Contraseñas</p>
          <p className="text-xs text-slate-400 mb-5">
            {suspendedCount > 0
              ? `${suspendedCount} cuenta${suspendedCount !== 1 ? 's' : ''} suspendida${suspendedCount !== 1 ? 's' : ''}.`
              : 'Todas las cuentas están activas.'}
          </p>
          <button onClick={() => setShowAddForm(true)} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#2563EB' }}>
            Revisar Cuentas
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
          <p className="text-sm font-semibold text-slate-900">Usuarios del sistema</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 w-44 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DEV">Desarrollador</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Suspendidos</option>
            </select>
            <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#0F172A' }}>
              <UserPlus size={14} />
              Nuevo usuario
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900 mb-3">Nuevo usuario del sistema</p>
            <form action={async (fd) => { await createUser(fd); setShowAddForm(false); router.refresh() }} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input name="name" placeholder="Nombre completo" required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="email" type="email" placeholder="Correo" required className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <input name="password" type="password" placeholder="Contraseña (mín 8)" required minLength={8} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <select name="role" className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="DEV">Desarrollador</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ backgroundColor: '#2563EB' }}>Crear</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-100">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-slate-100">
              <tr>
                {['Identidad', 'Rol', 'Estado', '2FA', 'Último acceso', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">Sin usuarios.</td></tr>
              ) : (
                filtered.map((user) => {
                  const roleCfg = ROLE_CONFIG[user.role] ?? { label: 'Viewer', cls: 'border border-slate-300 text-slate-700 bg-white' }
                  const initials = getInitials(user.name)
                  const avatarBg = avatarColor(user.name)
                  const statusCls = user.active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
                  const statusLabel = user.active ? 'Activo' : 'Suspendido'
                  const statusDot = user.active ? '#10B981' : '#94A3B8'
                  return (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarBg }}>{initials}</div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                            <p className="text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${roleCfg.cls}`}>{roleCfg.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCls}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDot }} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                            <Check size={10} /> Activo
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Inactivo</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(user.updatedAt).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditUser(user)} title="Editar" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => user.twoFactorEnabled ? handleDisable2FA(user.id) : handleSetup2FA(user)} disabled={isPending} title={user.twoFactorEnabled ? 'Desactivar 2FA' : 'Configurar 2FA'} className={`p-1.5 rounded transition-colors disabled:opacity-50 ${user.twoFactorEnabled ? 'text-teal-500 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}>
                            <QrCode size={14} />
                          </button>
                          <button onClick={() => handleToggle(user.id)} disabled={isPending} title={user.active ? 'Suspender' : 'Restaurar'} className={`p-1.5 rounded transition-colors disabled:opacity-50 ${user.active ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}>
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
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Mostrando {filtered.length} de {users.length} usuarios</p>
        </div>
      </div>
    </div>
  )
}
