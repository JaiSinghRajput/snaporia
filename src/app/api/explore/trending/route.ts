import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/explore/trending
 * Get trending hashtags based on recent usage
 */
export async function GET() {
  try {
    // No auth required for trending hashtags - public data
    
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
      take: 5,
      orderBy: { count: 'desc' },
      select: {
        id: true,
        name: true,
        count: true
      }
    })

    // Format for frontend
    const trends = trendingHashtags.map(tag => ({
      tag: tag.name,
      posts: formatCount(tag.count)
    }))

    return NextResponse.json({ trends })
  } catch (error) {
    console.error('Error fetching trending hashtags:', error)
    return NextResponse.json({ error: 'Failed to fetch trending hashtags' }, { status: 500 })
  }
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
