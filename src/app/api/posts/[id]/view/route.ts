import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserProfile } from '@/lib/user'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    
    // Get user profile if authenticated (optional for views)
    const { userId } = await auth()
    let userProfileId: string | null = null
    
    if (userId) {
      const profile = await getCurrentUserProfile()
      userProfileId = profile?.id || null
    }

    // Check if user has already viewed this post
    let alreadyViewed = false;
    if (userProfileId) {
      const existingView = await prisma.view.findFirst({
        where: {
          postId,
          userId: userProfileId,
        },
      });
      alreadyViewed = !!existingView;
    }

    // Only create a new view if not already viewed by this user
    if (!alreadyViewed) {
      await prisma.view.create({
        data: {
          postId,
          userId: userProfileId,
        },
      });
    }

    // Get updated view count
    const count = await prisma.view.count({ where: { postId } });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
