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
      sender: true,
    },
  })


  // Trigger Pusher event for real-time update
  try {
    await pusherServer.trigger(`conversation-${conversationId}`, "message", message)
  } catch {}

  return NextResponse.json({ message })
}
