import { redirect } from 'next/navigation'
import { createCredential } from '@/actions/vault'

export default function NewCredentialPage() {
  async function handleCreate(formData: FormData) {
    'use server'
    await createCredential(formData)
    redirect('/vault')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Nueva Credencial</h1>
      <form action={handleCreate} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input name="name" required className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor / Contraseña</label>
          <textarea name="value" required rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select name="category" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="SERVICE">Servicio (Stripe, AWS, etc.)</option>
            <option value="RESTAURANT">Restaurante</option>
            <option value="ACCOUNT">Cuenta</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
          <textarea name="notes" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
          Guardar
        </button>
      </form>
    </div>
  )
}
