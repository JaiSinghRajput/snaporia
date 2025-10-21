import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find all conversations for this user
  const conversations = await prisma.conversationParticipant.findMany({
    where: { user: { clerkUserId: userId } },
    include: {
      conversation: {
        include: {
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true },
          },
        },
      },
    },
    orderBy: { conversation: { lastMessageAt: "desc" } },
  })

  return NextResponse.json({ conversations })
}
