import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingProfile() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto w-full py-6 px-4">
        <div className="mb-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="-mt-10 flex items-end gap-4 px-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
