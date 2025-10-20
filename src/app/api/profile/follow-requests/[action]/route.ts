import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { acceptFollowRequest, rejectFollowRequest, getCurrentUserProfile } from '@/lib/user'

/**
 * POST /api/profile/follow-requests/[action]
 * Accept or reject a follow request
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ action: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserProfile = await getCurrentUserProfile()

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { action } = await context.params
    const { requesterId } = await req.json()

    if (!requesterId) {
      return NextResponse.json({ error: 'Requester ID is required' }, { status: 400 })
    }

    if (action === 'accept') {
      await acceptFollowRequest(requesterId, currentUserProfile.id)
      return NextResponse.json({ success: true, message: 'Follow request accepted' })
    } else if (action === 'reject') {
      await rejectFollowRequest(requesterId, currentUserProfile.id)
      return NextResponse.json({ success: true, message: 'Follow request rejected' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error managing follow request:', error)
    return NextResponse.json({ error: 'Failed to manage follow request' }, { status: 500 })
  }
}
