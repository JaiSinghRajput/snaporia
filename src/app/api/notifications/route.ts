import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications
 * Get all notifications for the current user
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

    // Get regular notifications
    const regularNotifications = await prisma.notification.findMany({
      where: {
        userId: currentUserProfile.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
    })

    // Get pending follow requests
    const followRequests = await prisma.follow.findMany({
      where: {
        followingId: currentUserProfile.id,
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
            isVerified: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert follow requests to notification format
    const followRequestNotifications = followRequests.map((req) => ({
      id: `follow_request_${req.id}`,
      type: 'FOLLOW_REQUEST',
      content: 'wants to follow you',
      isRead: false,
      createdAt: req.createdAt.toISOString(),
      actor: req.follower,
      actionData: {
        requesterId: req.followerId,
      },
    }))

    // Combine and sort all notifications
    const allNotifications = [
      ...followRequestNotifications,
      ...regularNotifications.map((notif) => ({
        id: notif.id,
        type: notif.type,
        content: notif.message,
        isRead: notif.isRead,
        createdAt: notif.createdAt.toISOString(),
        actor: notif.actor,
        actionData: {
          postId: notif.postId,
        },
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const unreadCount = allNotifications.filter((n) => !n.isRead).length

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount,
    })
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
