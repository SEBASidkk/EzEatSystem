import { patchRestaurantStatus, getRestaurantDetail } from '@/actions/restaurants'
import { auth } from '@/lib/auth'

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  const restaurant = await getRestaurantDetail(id).catch(() => null)

  if (!restaurant) {
    return <p className="text-gray-500">Restaurante no encontrado o Ez-eat no disponible.</p>
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
      <p className="text-sm text-gray-500 mb-6">ID: {restaurant.id}</p>
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-700">Estado actual: </span>
          <span className="text-sm text-gray-900">{restaurant.status}</span>
        </div>
        {role === 'ADMIN' && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Cambiar estado:</p>
            <div className="flex flex-wrap gap-2">
              {['active', 'inactive', 'suspended'].map((s) => (
                <form key={s} action={async () => {
                  'use server'
                  await patchRestaurantStatus(restaurant.ezeatId!, s)
                }}>
                  <button type="submit" className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">
                    {s}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
