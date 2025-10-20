"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface User {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  bio: string | null
  isVerified: boolean
}

interface FollowListModalProps {
  username: string
  type: "followers" | "following"
  isOpen: boolean
  onClose: () => void
}

export default function FollowListModal({
  username,
  type,
  isOpen,
  onClose,
}: FollowListModalProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, username, type])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/profile/${username}/${type}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(type === "followers" ? data.followers : data.following)
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (username: string) => {
    onClose()
    router.push(`/profile/${username}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer - Full screen on mobile, bottom sheet on desktop */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col md:max-w-lg md:mx-auto md:mb-4"
          >
            {/* Handle bar for mobile swipe indicator */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header - Sticky */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
              <button
                onClick={onClose}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {type === "followers" ? "Followers" : "Following"}
              </h2>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No {type === "followers" ? "followers" : "following"} yet
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type === "followers" 
                      ? "When people follow this account, they'll show up here" 
                      : "When this account follows others, they'll show up here"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => {
                    const fullName = [user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ")
                    const displayName = fullName || `@${user.username}`

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user.username)}
                        className="flex items-center gap-3 px-4 py-4 active:bg-gray-50 dark:active:bg-gray-800 cursor-pointer transition-colors"
                      >
                        {/* Avatar - Larger for better thumb targeting */}
                        <div className="flex-shrink-0">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={displayName}
                              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-gray-100 dark:ring-gray-800">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-base text-gray-900 dark:text-white truncate">
                              {displayName}
                            </p>
                            {user.isVerified && (
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
                            @{user.username}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                              {user.bio}
                            </p>
                          )}
                        </div>

                        {/* Chevron indicator */}
                        <ChevronLeft className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-180" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
