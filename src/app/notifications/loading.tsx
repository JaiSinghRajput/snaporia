import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingNotifications() {
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto w-full py-6 px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
