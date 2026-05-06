import { listUsers, createUser } from '@/actions/accounts'
import { AccountList } from '@/components/accounts/account-list'

export default async function AccountsPage() {
  const users = await listUsers()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Cuentas del Equipo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Agregar miembro</h2>
          <form action={createUser} className="space-y-3">
            <input name="name" placeholder="Nombre" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input name="email" type="email" placeholder="Email" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <input name="password" type="password" placeholder="Contraseña (mín. 8 chars)" required minLength={8} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            <select name="role" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              <option value="DEV">Dev</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 active:scale-95 transition-transform">
              Crear
            </button>
          </form>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Miembros</h2>
          <AccountList users={users} />
        </div>
      </div>
    </div>
  )
}
