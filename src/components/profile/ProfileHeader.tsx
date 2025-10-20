"use client"

import { useState } from "react"
import { MapPin, Link as LinkIcon, Calendar, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import FollowButton from "./FollowButton"
import FollowListModal from "./FollowListModal"
import { useRouter } from "next/navigation"

interface ProfileHeaderProps {
  profile: {
    id: string
    username: string
    firstName?: string | null
    lastName?: string | null
    bio?: string | null
    avatar?: string | null
    coverImage?: string | null
    location?: string | null
    website?: string | null
    isVerified: boolean
    isPrivate?: boolean
    createdAt: Date | string
    _count?: {
      posts: number
      followers: number
      following: number
    }
  }
  followStatus?: 'PENDING' | 'ACCEPTED' | null
  isFollowingYou?: boolean
  isOwnProfile: boolean
}

export default function ProfileHeader({
  profile,
  followStatus = null,
  isFollowingYou = false,
  isOwnProfile,
}: ProfileHeaderProps) {
  const router = useRouter()
  const [modalType, setModalType] = useState<"followers" | "following" | null>(null)

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  const joinDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="w-full">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
        {profile.coverImage && (
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative">
          {/* Avatar */}
          <div className="absolute -top-16 md:-top-20">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-2">
            {isOwnProfile ? (
              <Button
                onClick={() => router.push("/profile/edit")}
                variant="outline"
              >
                Edit Profile
              </Button>
            ) : (
              <FollowButton
                targetUserId={profile.id}
                initialIsFollowing={followStatus === 'ACCEPTED'}
                initialFollowStatus={followStatus}
                isFollowingYou={isFollowingYou}
              />
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4 md:mt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">
              {fullName || profile.username}
            </h1>
            {profile.isVerified && (
              <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500" />
            )}
            {profile.isPrivate && (
              <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full">
                🔒 Private
              </span>
            )}
            {isFollowingYou && !isOwnProfile && (
              <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                Follows you
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-4 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </div>
            )}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <LinkIcon className="w-4 h-4" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined {joinDate}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                {profile._count?.posts || 0}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Posts</span>
            </div>
            <button
              onClick={() => setModalType("followers")}
              className="hover:underline"
            >
              <span className="font-bold text-gray-900 dark:text-white">
                {profile._count?.followers || 0}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
            </button>
            <button
              onClick={() => setModalType("following")}
              className="hover:underline"
            >
              <span className="font-bold text-gray-900 dark:text-white">
                {profile._count?.following || 0}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Follow List Modal */}
      {modalType && (
        <FollowListModal
          username={profile.username}
          type={modalType}
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  )
}
