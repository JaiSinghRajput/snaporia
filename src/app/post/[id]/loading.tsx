export default function LoadingPost() {
  return (
    <div className="max-w-2xl mx-auto w-full py-6 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="mt-4 h-48 w-full bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  )
}
