import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { unfollowUser, getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/profile/unfollow
 * Unfollow a user
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

    await unfollowUser(currentUserProfile.id, targetUserId)

    return NextResponse.json({ success: true, message: 'User unfollowed successfully' })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
  }
}
