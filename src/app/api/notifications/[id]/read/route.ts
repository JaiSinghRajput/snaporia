import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/notifications/[id]/read
 * Mark a notification as read
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
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

    const { id } = await context.params

    // Update notification
    await prisma.notification.update({
      where: {
        id,
        userId: currentUserProfile.id, // Ensure user owns this notification
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}
