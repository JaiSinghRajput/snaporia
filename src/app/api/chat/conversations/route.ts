import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get the current user's database ID
  const currentUser = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  })

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Find all conversations for this user
  const conversationParticipants = await prisma.conversationParticipant.findMany({
    where: { userId: currentUser.id },
    include: {
      conversation: {
        include: {
          participants: { 
            include: { 
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            } 
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true
            }
          },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  })

  // Transform the data to a cleaner format
  const conversations = conversationParticipants.map(cp => ({
    id: cp.conversation.id,
    isGroup: cp.conversation.isGroup,
    groupName: cp.conversation.groupName,
    groupImage: cp.conversation.groupImage,
    lastMessageAt: cp.conversation.lastMessageAt.toISOString(),
    participants: cp.conversation.participants
      .filter(p => p.userId !== currentUser.id) // Only include other users
      .map(p => ({
        user: p.user
      })),
    messages: cp.conversation.messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    }))
  }))

  return NextResponse.json({ conversations })
}
