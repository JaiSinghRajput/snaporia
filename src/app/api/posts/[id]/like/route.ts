import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { pushUserNotification } from '@/lib/notifications'
import { getCurrentUserProfile, getUserProfileById } from '@/lib/user'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: postId } = await params
    const me = await getCurrentUserProfile()
    if (!me) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if already liked
    const existing = await prisma.like.findUnique({
      where: {
        userId_postId: { userId: me.id, postId },
      },
    })

    let liked = false
    if (existing) {
      await prisma.like.delete({
        where: { userId_postId: { userId: me.id, postId } },
      })
      liked = false
    } else {
      await prisma.like.create({
        data: {
          userId: me.id,
          postId,
        },
      })
      liked = true

      // Create notification to post author (avoid self-notify)
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      })
      if (post && post.authorId !== me.id) {
        const notif = await prisma.notification.create({
          data: {
            userId: post.authorId,
            actorId: me.id,
            type: 'LIKE',
            title: 'New like',
            message: 'liked your post',
            link: `/post/${postId}`,
            postId,
          },
        })
        // Push realtime update
        await pushUserNotification(post.authorId, {
          type: 'LIKE',
          title: 'New like',
          message: 'liked your post',
          link: `/post/${postId}`,
          postId,
        })
      }
    }

    const count = await prisma.like.count({ where: { postId } })
    return NextResponse.json({ liked, count })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
