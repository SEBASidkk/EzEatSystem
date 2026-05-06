import { listUsers, toggleUserActive, createUser } from '@/actions/accounts'

export default async function AccountsPage() {
  const users = await listUsers()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Cuentas del Equipo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Agregar miembro</h2>
          <form action={createUser} className="space-y-3">
            <input name="name" placeholder="Nombre" required className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-lg text-sm" />
            <input name="password" type="password" placeholder="Contraseña (mín. 8 chars)" required minLength={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
            <select name="role" className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="DEV">Dev</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium">Crear</button>
          </form>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Miembros</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="bg-white border rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
                </div>
                <form action={async () => {
                  'use server'
                  await toggleUserActive(user.id)
                }}>
                  <button type="submit" className={`text-xs px-2 py-1 rounded font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
