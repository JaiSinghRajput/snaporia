import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingExplore() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto w-full py-6 px-4">
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
