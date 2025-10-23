"use client"

import { TrendingUp, Hash, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Trend {
  tag: string
  posts: string
}

interface Suggestion {
  id: string
  username: string
  name: string
  avatar: string | null
  isVerified?: boolean
  followers: string
}

export default function RightSidebar() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loadingTrends, setLoadingTrends] = useState(true)
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)

  useEffect(() => {
    fetchTrends()
    fetchSuggestions()
  }, [])

  const fetchTrends = async () => {
    try {
      const response = await fetch('/api/explore/trending')
      if (response.ok) {
        const data = await response.json()
        setTrends(data.trends || [])
      }
    } catch (error) {
      console.error('Error fetching trends:', error)
    } finally {
      setLoadingTrends(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/users/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  return (
  <aside className="hidden xl:block xl:w-80 fixed right-0 top-16 bottom-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-y-auto overscroll-contain" style={{ overflowAnchor: 'none' }}>
      {/* Trending Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Trending
          </h3>
        </div>
        <div className="space-y-3">
          {loadingTrends ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
              </div>
            ))
          ) : trends.length > 0 ? (
            trends.map((trend) => (
              <Link
                key={trend.tag}
                href={`/explore?search=${encodeURIComponent('#' + trend.tag)}`}
                className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {trend.tag}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {trend.posts} posts
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No trending topics yet
            </p>
          )}
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Suggested for you
          </h3>
        </div>
        <div className="space-y-3">
          {loadingSuggestions ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
                </div>
              </div>
            ))
          ) : suggestions.length > 0 ? (
            suggestions.map((user) => (
              <div
                key={user.username}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.name[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      {user.isVerified && (
                        <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username} · {user.followers} followers
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/profile/${user.username}`}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  View
                </Link>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No suggestions available
            </p>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-4 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-2">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">About</a>
          <span>·</span>
          <a href="#" className="hover:underline">Help</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
        </div>
        <p>© 2025 Snaporia</p>
      </div>
    </aside>
  )
}
