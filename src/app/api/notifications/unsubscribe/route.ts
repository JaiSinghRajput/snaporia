import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

/**
 * POST /api/notifications/unsubscribe
 * Body: { endpoint: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Optional auth: allow unauthenticated unsubscription
    const { userId } = await auth()
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

    // If user is authenticated, ensure it belongs to them; otherwise just delete by endpoint
  await prisma.webPushSubscription.deleteMany({
      where: {
        endpoint,
        ...(userId ? { user: { clerkUserId: userId } } : {}),
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
