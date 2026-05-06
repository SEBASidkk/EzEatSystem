import { SkeletonRow } from '@/components/ui/skeleton'

export default function AccountsLoading() {
  return (
    <div>
      <div className="h-7 w-48 bg-gray-200 rounded animate-pulse-soft mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse-soft" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse-soft" />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse-soft mb-4" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg">
              <SkeletonRow />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
