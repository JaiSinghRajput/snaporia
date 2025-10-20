"use client"

import { useUser } from "@clerk/nextjs"
import { Home, Search, Bell, User, TrendingUp, Users } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

export default function LeftSidebar() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Explore", path: "/explore" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: User, label: "Profile", path: `/profile/${user?.username}` },
  ]

  return (
    <aside className="hidden md:flex md:w-20 lg:w-64 xl:w-72 fixed left-0 top-16 bottom-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 md:p-2 lg:p-4 flex-col">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center md:justify-center lg:justify-start gap-4 md:px-2 lg:px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title={item.label}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className="text-lg hidden lg:block">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* User Card */}
      {user && (
        <div className="mt-auto md:px-2 lg:px-0">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center md:justify-center lg:justify-start gap-3">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.firstName || "User"}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.firstName?.[0] || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0 hidden lg:block">
                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
