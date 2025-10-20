import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/lib/user'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const me = await getCurrentUserProfile()
    if (!me) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const { id: postId } = await params

    // create share (allow multiple per user)
    await prisma.share.create({
      data: { userId: me.id, postId },
    })

    // notify author (avoid self)
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
    if (post && post.authorId !== me.id) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          actorId: me.id,
          type: 'SHARE',
          title: 'Your post was shared',
          message: 'shared your post',
          link: `/post/${postId}`,
          postId,
        },
      })
    }

    const count = await prisma.share.count({ where: { postId } })
    return NextResponse.json({ shared: true, count })
  } catch (error) {
    console.error('Error sharing post:', error)
    return NextResponse.json({ error: 'Failed to share post' }, { status: 500 })
  }
}
