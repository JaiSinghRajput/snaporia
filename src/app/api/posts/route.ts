import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getFeedPosts } from '@/lib/posts'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * GET /api/posts
 * Get paginated feed posts
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get('cursor') || undefined
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get current user (optional - for checking if posts are liked)
    const { userId } = await auth()
    let userProfile = null
    
    if (userId) {
      userProfile = await getCurrentUserProfile()
    }

    const { posts, nextCursor } = await getFeedPosts({
      userId: userProfile?.id,
      cursor,
      limit,
    })

    return NextResponse.json({
      posts,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
