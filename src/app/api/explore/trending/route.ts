import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/explore/trending
 * Get trending hashtags based on recent usage
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hashtags with most posts in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const trendingHashtags = await prisma.hashtag.findMany({
      where: {
        posts: {
          some: {
            post: {
              createdAt: {
                gte: sevenDaysAgo,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { count: 'desc' },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    return NextResponse.json({ hashtags: trendingHashtags })
  } catch (error) {
    console.error('Error fetching trending hashtags:', error)
    return NextResponse.json({ error: 'Failed to fetch trending hashtags' }, { status: 500 })
  }
}
