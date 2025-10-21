import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { recipientId } = await req.json()
  if (!recipientId) {
    return NextResponse.json({ error: "Missing recipientId" }, { status: 400 })
  }

  // Get current user profile
  const currentUser = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
  })
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Check if conversation already exists between these two users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      participants: {
        every: {
          OR: [
            { userId: currentUser.id },
            { userId: recipientId },
          ],
        },
      },
    },
    include: {
      participants: true,
    },
  })

  // If found and has exactly 2 participants (both users), return it
  if (existingConversation && existingConversation.participants.length === 2) {
    const participantIds = existingConversation.participants.map((p) => p.userId)
    if (participantIds.includes(currentUser.id) && participantIds.includes(recipientId)) {
      return NextResponse.json({ conversationId: existingConversation.id })
    }
  }

  // Otherwise, create a new conversation
  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: currentUser.id },
          { userId: recipientId },
        ],
      },
    },
  })

  return NextResponse.json({ conversationId: conversation.id })
}
