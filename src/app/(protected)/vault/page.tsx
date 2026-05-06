import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listCredentials } from '@/actions/vault'
import { auth } from '@/lib/auth'
import { VaultList } from '@/components/vault/vault-list'

export default async function VaultPage() {
  const [credentials, session] = await Promise.all([listCredentials(), auth()])
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vault de Credenciales</h1>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Nueva credencial
        </Link>
      </div>
      <VaultList credentials={credentials} isAdmin={isAdmin} />
    </div>
  )
}
