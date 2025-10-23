import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { conversationId, content, imageUrl } = await req.json()
  if (!conversationId || (!content && !imageUrl)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  // Find participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, user: { clerkUserId: userId } },
  })
  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 })

  // Create message
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: participant.userId,
      content,
      imageUrl,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      },
    },
  })

  // Update conversation's lastMessageAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() }
  })

  // Trigger Pusher event for real-time update
  try {
    await pusherServer.trigger(`private-conversation-${conversationId}`, "new-message", {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
      status: 'sent'
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Pusher error:', error)
    }
  }

  return NextResponse.json({ 
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      status: 'sent'
    } 
  })
}
