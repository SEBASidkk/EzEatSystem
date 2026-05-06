'use client'
import { RevealButton } from './reveal-button'
import { DeleteCredentialButton } from './delete-credential-button'

interface CredentialCardProps {
  id: string
  name: string
  category: string
  updatedAt: Date
  isAdmin?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  SERVICE: 'bg-blue-100 text-blue-700',
  RESTAURANT: 'bg-green-100 text-green-700',
  ACCOUNT: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export function CredentialCard({ id, name, category, updatedAt, isAdmin }: CredentialCardProps) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3 animate-fade-slide hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Actualizado {new Date(updatedAt).toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700'}`}>
            {category}
          </span>
          {isAdmin && <DeleteCredentialButton credentialId={id} />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-400">••••••••••••</span>
        <RevealButton credentialId={id} />
      </div>
    </div>
  )
}
