import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'
import { pushUserNotification } from '@/lib/notifications'

/**
 * POST /api/notifications/read-all
 * Marks all regular notifications as read for the current user.
 * Note: Pending follow requests are not stored in the notifications table
 * and therefore are not affected by this endpoint.
 */
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserProfile = await getCurrentUserProfile()

    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Mark all unread regular notifications as read for this user
    const result = await prisma.notification.updateMany({
      where: {
        userId: currentUserProfile.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })
    await pushUserNotification(currentUserProfile.id, {
      type: 'MENTION',
      title: 'sync',
      message: 'read-all-update',
    })
    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
