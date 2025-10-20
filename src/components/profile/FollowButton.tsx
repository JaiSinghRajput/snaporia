"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus, Loader2, Clock, UserCheck } from "lucide-react"

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
  initialFollowStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null
  isFollowingYou?: boolean
  isOwnProfile?: boolean
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowStatus = null,
  isFollowingYou = false,
  isOwnProfile = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followStatus, setFollowStatus] = useState(initialFollowStatus)
  const [isLoading, setIsLoading] = useState(false)

  if (isOwnProfile) {
    return null
  }

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      const endpoint = isFollowing || followStatus === 'PENDING' ? "/api/profile/unfollow" : "/api/profile/follow"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (endpoint === "/api/profile/follow") {
          // Just followed or sent request
          setFollowStatus(data.status)
          setIsFollowing(data.status === 'ACCEPTED')
        } else {
          // Unfollowed or cancelled request
          setFollowStatus(null)
          setIsFollowing(false)
        }
      } else {
        const data = await response.json()
        console.error("Failed to update follow status:", data.error)
      }
    } catch (error) {
      console.error("Error updating follow status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Determine button state
  const isPending = followStatus === 'PENDING'
  const isAccepted = isFollowing || followStatus === 'ACCEPTED'

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isAccepted ? "outline" : isPending ? "secondary" : "default"}
      className="gap-2 min-w-[140px]"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPending ? (
        <>
          <Clock className="h-4 w-4" />
          Requested
        </>
      ) : isAccepted ? (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          {isFollowingYou ? (
            <>
              <UserCheck className="h-4 w-4" />
              Follow Back
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
        </>
      )}
    </Button>
  )
}
