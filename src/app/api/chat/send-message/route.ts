import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import webpush, { type PushSubscription } from "web-push"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
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

  // Web Push: notify other participants (not the sender)
  try {
    const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
    
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.warn('⚠️ VAPID keys not configured - push notifications disabled')
    } else {
      webpush.setVapidDetails(
        'mailto:notify@snaporia.app',
        VAPID_PUBLIC,
        VAPID_PRIVATE
      )

      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true }
      })
      const recipientIds = participants.map(p => p.userId).filter(id => id !== participant.userId)
      
      if (recipientIds.length > 0) {
        type DBPushSub = { endpoint: string; p256dh: string; auth: string }
        const subs = await prisma.webPushSubscription.findMany({
          where: { userId: { in: recipientIds } }
        }) as unknown as DBPushSub[]

        console.log(`📤 Sending push to ${subs.length} subscription(s) for ${recipientIds.length} recipient(s)`)

        const payload = JSON.stringify({
          title: message.sender?.firstName ? `${message.sender.firstName} sent a message` : 'New message',
          body: message.content?.slice(0, 140) || 'Image',
          url: `/messages/${conversationId}`,
          tag: `conversation-${conversationId}`,
          conversationId,
        })

        const results = await Promise.allSettled(subs.map(async (s: DBPushSub) => {
          try {
            const subscription: PushSubscription = {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            }
            await webpush.sendNotification(subscription, payload)
            console.log('✅ Push sent to:', s.endpoint.substring(0, 50) + '...')
          } catch (err: unknown) {
            const code = (err as { statusCode?: number })?.statusCode
            // Clean up expired subscriptions
            if (code === 410 || code === 404) {
              console.log('🗑️ Removing expired subscription:', s.endpoint.substring(0, 50) + '...')
              await prisma.webPushSubscription.delete({ where: { endpoint: s.endpoint } })
            } else {
              console.error('❌ Push send failed:', err)
              throw err
            }
          }
        }))
        
        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        console.log(`📊 Push results: ${successful} sent, ${failed} failed`)
      } else {
        console.log('ℹ️ No other participants to notify')
      }
    }
  } catch (error) {
    console.error('❌ Push notify error:', error)
  }

  return NextResponse.json({ 
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      status: 'sent'
    } 
  })
}
