import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ count: 0 })
    }

    const currentUserProfile = await getCurrentUserProfile()

    if (!currentUserProfile) {
      return NextResponse.json({ count: 0 })
    }

    // Count unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: currentUserProfile.id,
        isRead: false,
      },
    })

    // Count pending follow requests
    const pendingRequests = await prisma.follow.count({
      where: {
        followingId: currentUserProfile.id,
        status: 'PENDING',
      } as any,
    })

    const totalCount = unreadNotifications + pendingRequests

    return NextResponse.json({ count: totalCount })
  } catch (error: unknown) {
    console.error('Error fetching unread count:', error)
    return NextResponse.json({ count: 0 })
  }
}
