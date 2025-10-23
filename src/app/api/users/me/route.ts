import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  console.log('[/api/users/me] Clerk userId:', userId)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Find the UserProfile by Clerk userId
  const userProfile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, username: true },
  })

  console.log('[/api/users/me] UserProfile:', userProfile)
  if (!userProfile) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({ userId: userProfile.id })
}
