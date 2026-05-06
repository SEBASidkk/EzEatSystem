import { listRestaurants } from '@/actions/restaurants'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  unknown: 'bg-yellow-100 text-yellow-700',
}

interface Restaurant {
  id?: string
  ezeatId?: string
  name: string
  status: string
}

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants() as Restaurant[]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Restaurantes Ez-eat</h1>
      <div className="bg-white border rounded-lg divide-y">
        {restaurants.map((r) => (
          <Link
            key={r.id ?? r.ezeatId}
            href={`/restaurants/${r.id ?? r.ezeatId}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-medium text-sm text-gray-900">{r.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? STATUS_COLOR.unknown}`}>
              {r.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
