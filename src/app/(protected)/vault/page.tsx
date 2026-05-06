import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listCredentials } from '@/actions/vault'
import { CredentialCard } from '@/components/vault/credential-card'

export default async function VaultPage() {
  const credentials = await listCredentials()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Vault de Credenciales</h1>
        <Link
          href="/vault/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          <Plus size={16} />
          Nueva credencial
        </Link>
      </div>
      {credentials.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay credenciales.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentials.map((c) => (
            <CredentialCard key={c.id} id={c.id} name={c.name} category={c.category} updatedAt={c.updatedAt} />
          ))}
        </div>
      )}
    </div>
  )
}
