import { SkeletonRow } from '@/components/ui/skeleton'

export default function RestaurantsLoading() {
  return (
    <div>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft mb-6" />
      <div className="bg-white border rounded-lg divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
