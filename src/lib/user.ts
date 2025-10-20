import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Get or create a user profile from Clerk authentication
 * This ensures every Clerk user has a corresponding UserProfile in our database
 */
export async function getCurrentUserProfile() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  // Check if user profile exists
  const userProfile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  })

  // If not, we'll need to create it (this should be done during sign-up)
  if (!userProfile) {
    // You would typically get this data from Clerk
    // For now, return null and handle profile creation in a separate flow
    return null
  }

  return userProfile
}

/**
 * Get user profile by ID
 */
export async function getUserProfileById(id: string) {
  return await prisma.userProfile.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })
}

/**
 * Get user profile by username
 */
export async function getUserProfileByUsername(username: string) {
  return await prisma.userProfile.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  })
}

/**
 * Create a new user profile (called after Clerk sign-up)
 */
export async function createUserProfile(data: {
  clerkUserId: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
}) {
  return await prisma.userProfile.create({
    data,
  })
}

/**
 * Update user profile
 */
export async function updateUserProfile(id: string, data: Partial<{
  username: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  avatar: string | null
  coverImage: string | null
  location: string | null
  website: string | null
  dateOfBirth: Date | null
  isPrivate: boolean
}>) {
  return await prisma.userProfile.update({
    where: { id },
    data,
  })
}

/**
 * Check if user is following another user
 * Returns the follow status: null (not following), 'PENDING', 'ACCEPTED', or 'REJECTED'
 */
export async function getFollowStatus(followerId: string, followingId: string): Promise<'PENDING' | 'ACCEPTED' | 'REJECTED' | null> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    select: {
      status: true,
    },
  })
  return follow?.status || null
}

/**
 * Check if user is following another user (only accepted follows)
 */
export async function isFollowing(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    select: {
      status: true,
    },
  })
  return follow?.status === 'ACCEPTED'
}

/**
 * Check if user is being followed by another user (follow back detection)
 */
export async function isFollowedBy(userId: string, potentialFollowerId: string) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: potentialFollowerId,
        followingId: userId,
      },
    },
    select: {
      status: true,
    },
  })
  return follow?.status === 'ACCEPTED'
}

/**
 * Follow a user (creates pending request if target is private)
 */
export async function followUser(followerId: string, followingId: string, targetIsPrivate: boolean = false) {
  return await prisma.follow.create({
    data: {
      followerId,
      followingId,
      status: targetIsPrivate ? 'PENDING' : 'ACCEPTED',
    },
  })
}

/**
 * Accept a follow request
 */
export async function acceptFollowRequest(followerId: string, followingId: string) {
  return await prisma.follow.update({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    data: {
      status: 'ACCEPTED',
    },
  })
}

/**
 * Reject/Remove a follow request
 */
export async function rejectFollowRequest(followerId: string, followingId: string) {
  return await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string) {
  return await prisma.follow.delete({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })
}

/**
 * Get pending follow requests for a user
 */
export async function getPendingFollowRequests(userId: string) {
  return await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: 'PENDING',
    },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          isVerified: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}
