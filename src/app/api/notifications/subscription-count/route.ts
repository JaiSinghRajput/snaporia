import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/notifications/subscription-count
 * Get count of push subscriptions for current user
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

    const count = await prisma.webPushSubscription.count({
      where: {
        userId: currentUserProfile.id,
      },
    })

    return NextResponse.json({ count })
  } catch (error: unknown) {
    console.error('Error fetching subscription count:', error)
    return NextResponse.json({ count: 0 })
  }
}
