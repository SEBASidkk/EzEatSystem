import { auth } from '@/lib/auth'

export default async function SettingsPage() {
  const session = await auth()
  const user = session?.user as { name?: string; email?: string; role?: string } | undefined

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Preferencias de tu cuenta.</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Información de cuenta</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Nombre</p>
            <p className="text-sm text-slate-900">{user?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Correo</p>
            <p className="text-sm text-slate-900">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Rol</p>
            <p className="text-sm text-slate-900">{user?.role === 'ADMIN' ? 'Administrador' : 'Desarrollador'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          Para cambiar tu información, contacta a un administrador.
        </p>
      </div>
    </div>
  )
}
