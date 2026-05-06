interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse-soft ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function SkeletonKanbanCard() {
  return (
    <div className="bg-white rounded border p-3 space-y-2">
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}
