import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/lib/user'
import { extractHashtags, syncPostHashtags } from '@/lib/posts'

// DELETE /api/posts/[id]
// Deletes a post if the current user is the author
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await getCurrentUserProfile()
    if (!me) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.authorId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the post; related records (likes, comments, views, shares, hashtags) cascade via Prisma schema
    await prisma.post.delete({ where: { id } })

    // Note: Any media assets on S3 are not deleted here. Consider adding a background job to clean up orphaned files.
    return NextResponse.json({ success: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting post:', error)
    }
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

// PATCH /api/posts/[id]
// Updates a post (content, visibility) if the current user is the author
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const me = await getCurrentUserProfile()
    if (!me) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { content, visibility }: { content?: string; visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY' } = body

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data: Record<string, unknown> = {}
    if (typeof content === 'string') data.content = content
    if (visibility === 'PUBLIC' || visibility === 'PRIVATE' || visibility === 'FOLLOWERS_ONLY') data.visibility = visibility

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
    }

    const updated = await prisma.post.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, username: true, firstName: true, lastName: true, avatar: true, isVerified: true },
        },
        _count: { select: { likes: true, comments: true, shares: true, views: true } },
      },
    })

    if (typeof content === 'string') {
      const tags = extractHashtags(content)
      await syncPostHashtags(id, tags)
    }

    return NextResponse.json({ post: updated })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating post:', error)
    }
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}
