import { SkeletonCard } from '@/components/ui/skeleton'

export default function VaultLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg animate-pulse-soft" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
