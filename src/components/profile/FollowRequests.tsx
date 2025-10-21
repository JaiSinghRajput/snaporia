"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface FollowRequest {
  id: string
  followerId: string
  follower: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
    bio: string | null
    isVerified: boolean
  }
}

export default function FollowRequests() {
  const router = useRouter()
  const [requests, setRequests] = useState<FollowRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/profile/follow-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("Error fetching follow requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requesterId: string, action: "accept" | "reject") => {
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
        setRequests((prev) => prev.filter((req) => req.followerId !== requesterId))
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No follow requests
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          When people request to follow you, they&apos;ll appear here
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      <AnimatePresence>
        {requests.map((request) => {
          const fullName = [request.follower.firstName, request.follower.lastName]
            .filter(Boolean)
            .join(" ")
          const displayName = fullName || `@${request.follower.username}`

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 px-4 py-4"
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 cursor-pointer"
                onClick={() => router.push(`/profile/${request.follower.username}`)}
              >
                {request.follower.avatar ? (
                  <Image
                    src={request.follower.avatar}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-gray-100 dark:ring-gray-800">
                    {request.follower.username[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/profile/${request.follower.username}`)}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="font-semibold text-base text-gray-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  {request.follower.isVerified && (
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                  @{request.follower.username}
                </p>
                {request.follower.bio && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {request.follower.bio}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={() => handleAction(request.followerId, "accept")}
                  disabled={actionLoading === request.followerId}
                  size="sm"
                  className="gap-1.5"
                >
                  {actionLoading === request.followerId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAction(request.followerId, "reject")}
                  disabled={actionLoading === request.followerId}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
