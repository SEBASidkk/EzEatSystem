import { SkeletonKanbanCard } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-24 bg-gray-200 rounded animate-pulse-soft" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse-soft" />
      </div>
      <div className="grid grid-cols-4 gap-4 flex-1">
        {['Por hacer', 'En progreso', 'Bloqueado', 'Hecho'].map((col) => (
          <div key={col} className="bg-gray-100 rounded-lg p-3">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse-soft mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SkeletonKanbanCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
