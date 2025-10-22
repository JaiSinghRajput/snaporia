import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export type RTNotificationPayload = {
  type: 'FOLLOW_REQUEST' | 'FOLLOW' | 'LIKE' | 'COMMENT' | 'SHARE' | 'MENTION'
  title?: string
  message?: string
  link?: string
  postId?: string
  actor?: {
    id: string
    username: string
    firstName?: string | null
    lastName?: string | null
    avatar?: string | null
    isVerified?: boolean
  }
}

export async function pushUserNotification(userId: string, payload: RTNotificationPayload) {
  // Compute unread notifications + pending follow requests
  const [unreadNotifications, pendingRequests] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.follow.count({ where: { followingId: userId, status: 'PENDING' } }),
  ])

  const unreadCount = unreadNotifications + pendingRequests

  await pusherServer.trigger(`private-user-${userId}`, 'notification:new', {
    unreadCount,
    notification: payload,
  })
}
