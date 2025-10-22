import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { followUser, getCurrentUserProfile, getUserProfileById } from '@/lib/user'
import { pushUserNotification } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/follow
 * Follow a user (creates pending request if target is private)
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let currentUserProfile = await getCurrentUserProfile()

    if (!currentUserProfile) {
      // Attempt to create profile on-demand if it doesn't exist
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.primaryEmailAddress?.emailAddress
      const baseUsername = clerkUser.username || (email ? email.split('@')[0] : undefined)
      const fallback = `user_${clerkUser.id.slice(-6)}`
      const username = baseUsername || fallback

      // Upsert profile
      currentUserProfile = await prisma.userProfile.upsert({
        where: { clerkUserId: clerkUser.id },
        update: {},
        create: {
          clerkUserId: clerkUser.id,
          email: email || `${fallback}@example.com`,
          username,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          avatar: clerkUser.imageUrl ?? null,
        },
      })
    }

    const { targetUserId } = await req.json()

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 })
    }

    if (currentUserProfile.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Get target user to check if profile is private
    const targetUser = await getUserProfileById(targetUserId)
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const followResult = await followUser(currentUserProfile.id, targetUserId, targetUser.isPrivate)

    // If request is pending, push realtime notification to target user
    if (followResult.status === 'PENDING') {
      await pushUserNotification(targetUserId, {
        type: 'FOLLOW_REQUEST',
        title: 'Follow request',
        message: 'wants to follow you',
        link: `/profile/${currentUserProfile.username || ''}`,
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: targetUser.isPrivate ? 'Follow request sent' : 'User followed successfully',
      status: followResult.status,
      isPending: followResult.status === 'PENDING'
    })
  } catch (error: unknown) {
    console.error('Error following user:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
  }
}
