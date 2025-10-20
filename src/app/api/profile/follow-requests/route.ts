import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getPendingFollowRequests, getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/profile/follow-requests
 * Get pending follow requests for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserProfile = await getCurrentUserProfile()

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const requests = await getPendingFollowRequests(currentUserProfile.id)

    return NextResponse.json({ 
      requests,
      count: requests.length
    })
  } catch (error: unknown) {
    console.error('Error fetching follow requests:', error)
    return NextResponse.json({ error: 'Failed to fetch follow requests' }, { status: 500 })
  }
}
