'use client'
import { Trash2 } from 'lucide-react'
import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCredential } from '@/actions/vault'
import { useToast } from '@/lib/toast-context'

export function DeleteCredentialButton({ credentialId }: { credentialId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCredential(credentialId)
      if (result && 'error' in result) {
        toast(result.error, 'error')
      } else {
        toast('Credencial eliminada', 'success')
        router.refresh()
      }
      setShowConfirm(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
        aria-label="Eliminar credencial"
      >
        <Trash2 size={14} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 animate-fade-slide">
          <div className="bg-white rounded-xl p-6 shadow-xl w-80 space-y-4">
            <p className="font-semibold text-gray-900">¿Eliminar credencial?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
