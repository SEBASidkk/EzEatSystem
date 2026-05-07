import { listRestaurants } from '@/actions/restaurants'
import { RestaurantList } from '@/components/restaurants/restaurant-list'
import { auth } from '@/lib/auth'
import { Building2 } from 'lucide-react'

export default async function RestaurantsPage() {
  const [restaurants, session] = await Promise.all([listRestaurants(), auth()])
  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-slate-900" />
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Ez-eat</p>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Negocios Afiliados</h1>
            <p className="text-sm text-slate-500">Directorio de restaurantes registrados en la plataforma.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          <span className="font-semibold">{restaurants.length}</span> negocios
        </div>
      </div>
      <RestaurantList
        restaurants={restaurants as { id?: string; ezeatId?: string; name: string; status: string; plan?: string }[]}
        isAdmin={isAdmin}
      />
    </div>
  )
}
