import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/explore/suggested-users
 * Get suggested users based on various factors
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
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get users that current user is not following
    const suggestedUsers = await prisma.userProfile.findMany({
      where: {
        id: { not: currentUser.id },
        followers: {
          none: {
            followerId: currentUser.id,
          },
        },
      },
      take: limit,
      orderBy: [
        { followers: { _count: 'desc' } }, // Most followed
        { createdAt: 'desc' }, // Newest
      ],
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

    const users = suggestedUsers.map((user) => ({
      ...user,
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      avatarUrl: user.avatar,
      isFollowing: user.followers.length > 0,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching suggested users:', error)
    return NextResponse.json({ error: 'Failed to fetch suggested users' }, { status: 500 })
  }
}
