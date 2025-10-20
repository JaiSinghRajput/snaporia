"use client"

import { TrendingUp, Hash, UserPlus } from "lucide-react"

export default function RightSidebar() {
  const trends = [
    { tag: "NextJS", posts: "12.5K" },
    { tag: "TypeScript", posts: "8.2K" },
    { tag: "WebDev", posts: "15.1K" },
    { tag: "React", posts: "24.3K" },
    { tag: "TailwindCSS", posts: "6.8K" },
  ]

  const suggestions = [
    {
      username: "johndoe",
      name: "John Doe",
      avatar: null,
      followers: "1.2K",
    },
    {
      username: "janesmith",
      name: "Jane Smith",
      avatar: null,
      followers: "856",
    },
    {
      username: "alexdev",
      name: "Alex Developer",
      avatar: null,
      followers: "2.1K",
    },
  ]

  return (
    <aside className="hidden xl:block xl:w-80 fixed right-0 top-16 bottom-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 overflow-y-auto">
      {/* Trending Section */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            Trending
          </h3>
        </div>
        <div className="space-y-3">
          {trends.map((trend) => (
            <div
              key={trend.tag}
              className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
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
            </div>
          ))}
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
          {suggestions.map((user) => (
            <div
              key={user.username}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.name[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{user.username} · {user.followers} followers
                </p>
              </div>
              <button className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                Follow
              </button>
            </div>
          ))}
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
