"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserCheck } from "lucide-react"
import Image from "next/image"

interface User {
  id: string
  clerkId: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  isFollowing: boolean
  followersCount: number
  followingCount: number
  postsCount: number
}

interface UserCardProps {
  user: User
}

export default function UserCard({ user }: UserCardProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(user.isFollowing)
  const [followersCount, setFollowersCount] = useState(user.followersCount)
  const [loading, setLoading] = useState(false)

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return

    setLoading(true)
    try {
      const endpoint = isFollowing ? '/api/profile/unfollow' : '/api/profile/follow'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id }),
      })

      if (res.ok) {
        setIsFollowing(!isFollowing)
        setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1))
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={() => router.push(`/profile/${user.username}`)}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer"
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
            {user.displayName[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {user.displayName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          @{user.username}
        </p>
        {user.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
            {user.bio}
          </p>
        )}
        <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{user.postsCount} posts</span>
          <span>{followersCount} followers</span>
        </div>
      </div>

      {/* Follow Button */}
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
          isFollowing
            ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        } disabled:opacity-50`}
      >
        {isFollowing ? (
          <>
            <UserCheck size={16} />
            <span className="hidden sm:inline">Following</span>
          </>
        ) : (
          <>
            <UserPlus size={16} />
            <span className="hidden sm:inline">Follow</span>
          </>
        )}
      </button>
    </div>
  )
}
