import Link from 'next/link'

export default function PostNotFound() {
  return (
    <div className="max-w-2xl mx-auto w-full py-12 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Post not found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">The post you’re looking for doesn’t exist or may have been removed.</p>
      <Link
        href="/"
        className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
      >
        Go back home
      </Link>
    </div>
  )
}
