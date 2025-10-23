import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversationId = searchParams.get("conversationId")
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })

  // Check participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, user: { clerkUserId: userId } },
  })
  if (!participant) return NextResponse.json({ error: "Not a participant" }, { status: 403 })

  // Fetch messages
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { 
      sender: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true
        }
      }
    },
    take: 100,
  })

  // Transform messages to include proper status
  const transformedMessages = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    createdAt: msg.createdAt.toISOString(),
    sender: msg.sender,
    status: msg.senderId === participant.userId 
      ? (msg.isRead ? 'read' : 'sent')
      : undefined
  }))

  return NextResponse.json({ messages: transformedMessages })
}
