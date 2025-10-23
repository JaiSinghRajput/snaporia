import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/explore/trending-posts
 * Get trending posts based on engagement
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await getCurrentUserProfile()
    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get posts from last 7 days for trending calculation
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const posts = await prisma.post.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        author: true,
        likes: {
          where: { userId: currentUser.id },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            views: true,
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    })

    // Calculate trending score for each post
    const postsWithScore = posts.map((post) => {
      const views = post._count.views
      const likes = post._count.likes
      const comments = post._count.comments
      const shares = post._count.shares
      
      // Engagement score (weighted)
      const engagementScore = 
        (views * 1) +      // 1 point per view
        (likes * 10) +     // 10 points per like
        (comments * 20) +  // 20 points per comment
        (shares * 30)      // 30 points per share
      
      // Time decay factor (newer posts get boost)
      const hoursSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)
      const timeDecayFactor = 1 / (1 + hoursSincePost / 24) // Decay over 24 hours
      
      // Final trending score
      const trendingScore = engagementScore * timeDecayFactor
      
      return {
        ...post,
        trendingScore,
      }
    })

    // Sort by trending score and limit results
    const trendingPosts = postsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)

    const formattedPosts = trendingPosts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      viewCount: post._count.views,
    }))

    return NextResponse.json({ posts: formattedPosts })
  } catch (error) {
    console.error('Error fetching trending posts:', error)
    return NextResponse.json({ error: 'Failed to fetch trending posts' }, { status: 500 })
  }
}
