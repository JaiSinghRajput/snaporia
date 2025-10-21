"use client"

import { useEffect, useState } from "react"
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs"
import { Bell, Heart, MessageCircle, Share2, UserPlus, UserCheck, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import LeftSidebar from "@/components/layout/LeftSidebar"
import RightSidebar from "@/components/layout/RightSidebar"
import { Button } from "@/components/ui/button"

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

export default function NotificationsPage() {
  const router = useRouter()
  const { isLoaded, userId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [bulkMarking, setBulkMarking] = useState(false)

  useEffect(() => {
    if (isLoaded && userId) {
      fetchNotifications()
    }
  }, [isLoaded, userId])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAllAsRead = async () => {
    // Optimistic update
    setBulkMarking(true)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (!res.ok) {
        // Re-fetch to sync if server failed
        await fetchNotifications()
      }
    } catch (e) {
      // On error, re-fetch to restore correct state
      await fetchNotifications()
    } finally {
      setBulkMarking(false)
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
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleFollowRequest = async (
    requesterId: string,
    action: "accept" | "reject",
    notificationId: string
  ) => {
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
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        )
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

    if (
      notification.type === "FOLLOW" ||
      notification.type === "FOLLOW_REQUEST"
    ) {
      if (notification.actor) {
        router.push(`/profile/${notification.actor.username}`)
      }
    } else if (notification.actionData?.postId) {
      router.push(`/post/${notification.actionData.postId}`)
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
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">Sign in to see notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Stay updated with likes, comments, and follows
            </p>
            <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex">
          <LeftSidebar />

          <main className="flex-1 md:ml-20 lg:ml-64 xl:mr-80 min-h-screen border-x border-gray-200 dark:border-gray-800">
            <div className="max-w-2xl mx-auto w-full py-6 px-4">
              {/* Header */}
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Notifications
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Stay updated with your activity
                  </p>
                </div>
                {notifications.some((n) => !n.isRead) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={bulkMarking}
                  >
                    {bulkMarking ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Marking…
                      </span>
                    ) : (
                      'Mark all as read'
                    )}
                  </Button>
                )}
              </div>

              {/* Notifications List */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No notifications yet
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      We&apos;ll notify you when something happens
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notifications.map((notification) => {
                      const fullName = notification.actor
                        ? [
                            notification.actor.firstName,
                            notification.actor.lastName,
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : ""
                      const displayName =
                        fullName || notification.actor?.username

                      return (
                        <div
                          key={notification.id}
                          className={`px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                            !notification.isRead
                              ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0 mt-0.5">
                              {notification.actor ? (
                                <div
                                  className="relative cursor-pointer"
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                >
                                  {notification.actor.avatar ? (
                                    <img
                                      src={notification.actor.avatar}
                                      alt={displayName}
                                      className="w-12 h-12 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                      {notification.actor.username[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div
                                className="cursor-pointer"
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
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
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      onClick={() =>
                                        handleFollowRequest(
                                          notification.actionData!.requesterId!,
                                          "accept",
                                          notification.id
                                        )
                                      }
                                      disabled={
                                        actionLoading ===
                                        notification.actionData.requesterId
                                      }
                                      size="sm"
                                      className="h-9"
                                    >
                                      {actionLoading ===
                                      notification.actionData.requesterId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <>
                                          <UserCheck className="w-4 h-4 mr-1" />
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
                                      disabled={
                                        actionLoading ===
                                        notification.actionData.requesterId
                                      }
                                      variant="outline"
                                      size="sm"
                                      className="h-9"
                                    >
                                      <X className="w-4 h-4" />
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
            </div>
          </main>

          <RightSidebar />
        </div>
      </SignedIn>
    </div>
  )
}
