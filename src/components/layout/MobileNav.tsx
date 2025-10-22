"use client"

import { SignedIn, useUser } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import { Home, Search, Bell, User, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { pusherClient } from "@/lib/pusher-client"
import type { Channel } from "pusher-js"

export default function MobileNav() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [unread, setUnread] = useState<number>(0)

  useEffect(() => {
    let active = true
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { count?: number }
        if (active) setUnread(data?.count ?? 0)
      } catch {
        // ignore network errors
      }
    }
    fetchUnread()
    // refresh periodically
    const id = setInterval(fetchUnread, 30_000)
    return () => { active = false; clearInterval(id) }
  }, [])

  // Realtime subscription for unread badge
  useEffect(() => {
    let channel: Channel | null = null
    let channelName = ""
    let mounted = true
    const setup = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const data = await res.json() as { userId: string }
        if (!mounted) return
  channelName = `private-user-${data.userId}`
  channel = pusherClient.subscribe(channelName)
        channel.bind('notification:new', (payload: { unreadCount: number }) => {
          setUnread(payload.unreadCount ?? 0)
        })
      } catch {}
    }
    setup()
    return () => {
      mounted = false
      try {
        if (channel) {
          channel.unbind_all()
          if (channelName) pusherClient.unsubscribe(channelName)
        }
      } catch {}
    }
  }, [])

  // Helper to detect active state (basic startsWith match for sections)
  const isActive = (path: string) => {
    if (path === "/") return pathname === "/"
    return pathname?.startsWith(path)
  }

  const go = (path: string) => router.push(path)

  const profilePath = user?.username ? `/profile/${user.username}` : "/profile/edit"

  return (
    <SignedIn>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-gray-950/70"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        aria-label="Primary"
      >
        <div className="mx-auto max-w-2xl">
          <ul className="grid grid-cols-5 items-stretch h-14">
            <li>
              <button
                onClick={() => go("/")}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive("/") ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                }`}
                aria-label="Home"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => go("/explore")}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive("/explore") ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                }`}
                aria-label="Explore"
              >
                <Search className="h-5 w-5" />
                <span>Explore</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => go("/messages")}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive("/messages") ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                }`}
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Chats</span>
              </button>
            </li>
            <li className="relative">
              <button
                onClick={() => go("/notifications")}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive("/notifications") ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                }`}
                aria-label="Notifications"
              >
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
                <span>{unread > 0 ? "Alerts" : "Alerts"}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => go(profilePath)}
                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive("/profile") ? "text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-300"
                }`}
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </SignedIn>
  )
}
