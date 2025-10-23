import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"

/**
 * POST /api/notifications/subscribe
 * Body: {
 *   endpoint: string,
 *   keys: { p256dh: string, auth: string }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { endpoint, keys } = await req.json()
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    // Lookup DB user
    const user = await prisma.userProfile.findUnique({
      where: { clerkUserId: userId },
      select: { id: true }
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Upsert subscription by endpoint
  await prisma.webPushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}
