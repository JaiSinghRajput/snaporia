import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const { userId } = await auth()
    
    let currentUserId: string | null = null
    
    // Get current user's ID if authenticated
    if (userId) {
      const currentUser = await prisma.userProfile.findUnique({
        where: { clerkUserId: userId },
        select: { id: true }
      })
      currentUserId = currentUser?.id || null
    }

    // Get user suggestions
    // 1. Users with most followers
    // 2. Exclude current user
    // 3. Exclude users already followed by current user
    const suggestions = await prisma.userProfile.findMany({
      take: 3,
      where: {
        ...(currentUserId ? {
          AND: [
            { id: { not: currentUserId } },
            {
              followers: {
                none: {
                  followerId: currentUserId
                }
              }
            }
          ]
        } : {}),
      },
      orderBy: {
        followers: {
          _count: 'desc'
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        _count: {
          select: {
            followers: true
          }
        }
      }
    })

    // Format the suggestions
    const formattedSuggestions = suggestions.map(user => ({
      id: user.id,
      username: user.username,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      avatar: user.avatar,
      isVerified: user.isVerified,
      followers: formatCount(user._count.followers)
    }))

    return NextResponse.json({ suggestions: formattedSuggestions })
  } catch (error) {
    console.error('Error fetching user suggestions:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
