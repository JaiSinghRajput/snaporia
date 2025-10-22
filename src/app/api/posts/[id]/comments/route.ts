import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { pushUserNotification } from '@/lib/notifications'
import { getCurrentUserProfile } from '@/lib/user'

// GET /api/posts/[id]/comments - list comments
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/posts/[id]/comments - add a comment
export async function POST(
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

    const { id: postId } = await params
    const body = await req.json()
    const { content, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: me.id,
        postId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
        },
        _count: { select: { replies: true } },
      },
    })

    // Notify post author (avoid self-notify)
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (post && post.authorId !== me.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: me.id,
          type: 'COMMENT',
          title: 'New comment',
          message: 'commented on your post',
          link: `/post/${postId}`,
          postId,
        },
      })
      await pushUserNotification(post.authorId, {
        type: 'COMMENT',
        title: 'New comment',
        message: 'commented on your post',
        link: `/post/${postId}`,
        postId,
      })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
