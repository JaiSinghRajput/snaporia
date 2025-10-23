"use client"

import { useRouter } from "next/navigation"
import { Hash, TrendingUp } from "lucide-react"

interface Hashtag {
  id: string
  name: string
  count: number
  _count?: {
    posts: number
  }
}

interface HashtagCardProps {
  hashtag: Hashtag
  rank?: number
}

export default function HashtagCard({ hashtag, rank }: HashtagCardProps) {
  const router = useRouter()
  const postCount = hashtag._count?.posts || hashtag.count

  const handleClick = () => {
    // Navigate to search with hashtag
    router.push(`/explore?q=${encodeURIComponent(hashtag.name)}&type=posts`)
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer"
    >
      {/* Rank Badge (if provided) */}
      {rank && (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
          {rank}
        </div>
      )}

      {/* Hashtag Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
        <Hash className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          #{hashtag.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {postCount.toLocaleString()} {postCount === 1 ? 'post' : 'posts'}
        </p>
      </div>

      {/* Trending Icon */}
      <div className="text-indigo-600 dark:text-indigo-400">
        <TrendingUp size={20} />
      </div>
    </div>
  )
}
