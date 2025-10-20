import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserProfileByUsername, isFollowing, getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/profile/[username]
 * Get user profile by username
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const profile = await getUserProfileByUsername(username)

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if current user is following this profile
    const { userId } = await auth()
    let isFollowingUser = false

    if (userId) {
      const currentUser = await getCurrentUserProfile()
      if (currentUser) {
        isFollowingUser = await isFollowing(currentUser.id, profile.id)
      }
    }

    return NextResponse.json({
      profile,
      isFollowing: isFollowingUser,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
