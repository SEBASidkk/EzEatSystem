import { listRestaurants } from '@/actions/restaurants'
import { RestaurantList } from '@/components/restaurants/restaurant-list'

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Restaurantes Ez-eat</h1>
      <RestaurantList restaurants={restaurants as { id?: string; ezeatId?: string; name: string; status: string; plan?: string }[]} />
    </div>
  )
}
