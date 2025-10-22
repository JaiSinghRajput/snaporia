"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Bell, Loader2, UserPlus, Heart, MessageCircle, Share2, UserCheck, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { pusherClient } from "@/lib/pusher-client"
import type { Channel } from "pusher-js"
import Image from "next/image"

interface Notification {
  id: string
  type: "FOLLOW_REQUEST" | "FOLLOW" | "LIKE" | "COMMENT" | "SHARE" | "MENTION"
  content: string
  isRead: boolean
  createdAt: string
  actor?: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
    isVerified: boolean
  }
  actionData?: {
    postId?: string
    requesterId?: string
  }
}

export default function NotificationDropdown() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
      // Only fetch if user is authenticated
      if (!isLoaded || !userId) {
        return
      }

    // Fetch unread count on mount
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
    }, [isLoaded, userId])

  // Realtime updates via Pusher private channel
  useEffect(() => {
    let channel: Channel | null = null
    let channelName = ""
    let active = true
    const subscribe = async () => {
      if (!isLoaded || !userId) return
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) return
        const data = await res.json() as { userId: string }
        if (!active) return
  channelName = `private-user-${data.userId}`
  channel = pusherClient.subscribe(channelName)
        channel.bind('notification:new', (payload: { unreadCount: number }) => {
          setUnreadCount(payload.unreadCount ?? 0)
          // Optionally refresh the list if dropdown is open
          if (isOpen) {
            fetchNotifications()
          }
        })
      } catch {
        // ignore
      }
    }
    subscribe()
    return () => {
      active = false
      try {
        if (channel) {
          channel.unbind_all()
          if (channelName) pusherClient.unsubscribe(channelName)
        }
      } catch {}
    }
  }, [isLoaded, userId, isOpen])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count")
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      } else if (response.status === 401) {
        // User not authenticated, silently fail
        setUnreadCount(0)
      }
    } catch (error) {
      // Network error or API unavailable, silently fail
      console.error("Error fetching unread count:", error)
      setUnreadCount(0)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      })
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleFollowRequest = async (requesterId: string, action: "accept" | "reject", notificationId: string) => {
    setActionLoading(requesterId)
    try {
      const response = await fetch(`/api/profile/follow-requests/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requesterId }),
      })

      if (response.ok) {
        // Remove notification from list
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Navigate based on type
    if (notification.type === "FOLLOW" || notification.type === "FOLLOW_REQUEST") {
      if (notification.actor) {
        router.push(`/profile/${notification.actor.username}`)
        setIsOpen(false)
      }
    } else if (notification.actionData?.postId) {
      router.push(`/post/${notification.actionData.postId}`)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FOLLOW_REQUEST":
      case "FOLLOW":
        return <UserPlus className="w-5 h-5 text-indigo-600" />
      case "LIKE":
        return <Heart className="w-5 h-5 text-red-500" />
      case "COMMENT":
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case "SHARE":
        return <Share2 className="w-5 h-5 text-green-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    We&apos;ll notify you when something happens
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => {
                    const fullName = notification.actor
                      ? [notification.actor.firstName, notification.actor.lastName]
                          .filter(Boolean)
                          .join(" ")
                      : ""
                    const displayName = fullName || notification.actor?.username

                    return (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                          !notification.isRead ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar or Icon */}
                          <div className="flex-shrink-0 mt-0.5">
                            {notification.actor ? (
                              <div
                                className="relative cursor-pointer"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                {notification.actor.avatar ? (
                                  <Image
                                    src={notification.actor.avatar}
                                    alt={displayName || notification.actor.username}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {notification.actor.username[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                {getNotificationIcon(notification.type)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div
                              className="cursor-pointer"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <p className="text-sm text-gray-900 dark:text-white leading-snug">
                                {notification.actor && (
                                  <span className="font-semibold">
                                    {displayName}
                                    {notification.actor.isVerified && (
                                      <span className="inline-block ml-1">
                                        <svg
                                          className="w-4 h-4 text-blue-500 inline"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                        </svg>
                                      </span>
                                    )}
                                  </span>
                                )}{" "}
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTime(notification.createdAt)}
                              </p>
                            </div>

                            {/* Follow Request Actions */}
                            {notification.type === "FOLLOW_REQUEST" &&
                              notification.actionData?.requesterId && (
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    onClick={() =>
                                      handleFollowRequest(
                                        notification.actionData!.requesterId!,
                                        "accept",
                                        notification.id
                                      )
                                    }
                                    disabled={actionLoading === notification.actionData.requesterId}
                                    size="sm"
                                    className="h-8 text-xs"
                                  >
                                    {actionLoading === notification.actionData.requesterId ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <UserCheck className="w-3 h-3 mr-1" />
                                        Accept
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleFollowRequest(
                                        notification.actionData!.requesterId!,
                                        "reject",
                                        notification.id
                                      )
                                    }
                                    disabled={actionLoading === notification.actionData.requesterId}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
