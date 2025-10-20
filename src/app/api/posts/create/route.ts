import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createPost } from '@/lib/posts'
import { getCurrentUserProfile } from '@/lib/user'

/**
 * POST /api/posts/create
 * Create a new post
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProfile = await getCurrentUserProfile()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile.' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { content, imageUrls, videoUrl, visibility } = body

      // Validate that at least content, images, or video are provided
      const hasContent = content && content.trim().length > 0
      const hasImages = imageUrls && imageUrls.length > 0
      const hasVideo = videoUrl && videoUrl.trim().length > 0
    
      if (!hasContent && !hasImages && !hasVideo) {
        return NextResponse.json(
          { error: 'Post must have content, images, or a video' },
          { status: 400 }
        )
    }

    const post = await createPost({
      content,
      authorId: userProfile.id,
      imageUrls: imageUrls || [],
      videoUrl: videoUrl || undefined,
      visibility: visibility || 'PUBLIC',
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
