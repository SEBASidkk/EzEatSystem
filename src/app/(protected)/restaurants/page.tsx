import { listRestaurants } from '@/actions/restaurants'
import { RestaurantList } from '@/components/restaurants/restaurant-list'
import { UserPlus } from 'lucide-react'

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Affiliate Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and monitor verified restaurant partners.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#2563EB' }}>
          <UserPlus size={15} />
          Add Partner
        </button>
      </div>
      <RestaurantList restaurants={restaurants as { id?: string; ezeatId?: string; name: string; status: string; plan?: string }[]} />
    </div>
  )
}
