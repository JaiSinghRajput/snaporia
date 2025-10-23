import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/explore/search
 * Search across posts, users, and hashtags
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
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // all, posts, users, hashtags
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({
        posts: [],
        users: [],
        hashtags: [],
      })
    }

    const results: {
      posts?: unknown[]
      users?: unknown[]
      hashtags?: unknown[]
    } = {}

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            {
              hashtags: {
                some: {
                  hashtag: {
                    name: { contains: query, mode: 'insensitive' }
                  }
                }
              }
            }
          ],
        },
        take: limit,
        orderBy: [
          { views: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
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

      results.posts = posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: post._count.likes,
        comments: post._count.comments,
        shares: post._count.shares,
        viewCount: post._count.views,
      }))
    }

    // Search Users
    if (type === 'all' || type === 'users') {
      const users = await prisma.userProfile.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { bio: { contains: query, mode: 'insensitive' } },
          ],
          id: { not: currentUser.id }, // Exclude current user
        },
        take: limit,
        include: {
          followers: {
            where: { followerId: currentUser.id },
            select: { id: true },
          },
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      })

      results.users = users.map((user) => ({
        ...user,
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        isFollowing: user.followers.length > 0,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        postsCount: user._count.posts,
      }))
    }

    // Search Hashtags
    if (type === 'all' || type === 'hashtags') {
      const hashtags = await prisma.hashtag.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { count: 'desc' },
      })

      results.hashtags = hashtags
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
