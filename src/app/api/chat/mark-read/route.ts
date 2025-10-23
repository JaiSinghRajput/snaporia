import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { conversationId, messageIds } = await req.json()
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
  }

  // Get current user's database ID
  const currentUser = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true }
  })

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Verify user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: currentUser.id },
  })
  
  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 })
  }

  // Mark messages as read (only messages not sent by current user)
  const updateResult = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUser.id },
      isRead: false,
      ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {})
    },
    data: {
      isRead: true
    }
  })

  // Get the updated messages to notify sender
  if (updateResult.count > 0) {
    const updatedMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        isRead: true,
        ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {})
      },
      select: {
        id: true,
        senderId: true
      }
    })

    // Trigger Pusher event to notify senders their messages were read
    try {
      await pusherServer.trigger(`private-conversation-${conversationId}`, "messages-read", {
        readBy: currentUser.id,
        messageIds: updatedMessages.map(m => m.id)
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Pusher error:', error)
      }
    }
  }

  return NextResponse.json({ success: true, count: updateResult.count })
}
