import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
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

  // Get messages to mark as read
  const messagesToMark = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: currentUser.id },
      isRead: false,
      ...(messageIds && messageIds.length > 0 ? { id: { in: messageIds } } : {})
    },
    select: {
      id: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  if (messagesToMark.length === 0) {
    return NextResponse.json({ success: true, count: 0 })
  }

  // Find the latest message timestamp
  const latestMessageTime = messagesToMark[0].createdAt

  // Mark all unread messages from others up to and including the latest read message
  const updateResult = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUser.id },
      isRead: false,
      createdAt: { lte: latestMessageTime }
    },
    data: {
      isRead: true
    }
  })

  // Get all messages that were marked as read
  if (updateResult.count > 0) {
    const updatedMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        createdAt: { lte: latestMessageTime }
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
