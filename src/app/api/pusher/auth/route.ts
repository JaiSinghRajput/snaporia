import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { pusherServer } from '@/lib/pusher'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      console.log('[Pusher Auth] No userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserProfile = await getCurrentUserProfile()
    if (!currentUserProfile) {
      console.log('[Pusher Auth] User profile not found for userId:', userId)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const body = await req.text()
    let socket_id = ''
    let channel_name = ''

    try {
      const json = JSON.parse(body)
      socket_id = json.socket_id
      channel_name = json.channel_name
    } catch {
      const params = new URLSearchParams(body)
      socket_id = params.get('socket_id') || ''
      channel_name = params.get('channel_name') || ''
    }

    console.log('[Pusher Auth] Request:', { userId: currentUserProfile.id, channel_name, socket_id: socket_id.substring(0, 10) + '...' })

    if (!socket_id || !channel_name) {
      console.log('[Pusher Auth] Missing socket_id or channel_name')
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

      // 1. Allow user to subscribe to their own private channel
      const expectedUserChannel = `private-user-${currentUserProfile.id}`
      if (channel_name === expectedUserChannel) {
        console.log('[Pusher Auth] ✅ Authorized private channel:', channel_name)
        const authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
        return new NextResponse(JSON.stringify(authResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // 2. Allow user to subscribe to conversation channels they're a participant in
      if (channel_name.startsWith('private-conversation-')) {
        const conversationId = channel_name.replace('private-conversation-', '')
      
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: currentUserProfile.id
          }
        })
      
        if (participant) {
          console.log('[Pusher Auth] ✅ Authorized conversation:', conversationId)
          const authResponse = pusherServer.authorizeChannel(socket_id, channel_name)
          return new NextResponse(JSON.stringify(authResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } else {
          // Check if conversation exists and who the participants are
          const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId },
            include: {
              participants: {
                include: {
                  user: {
                    select: { id: true, username: true }
                  }
                }
              }
            }
          })
          console.log('[Pusher Auth] ❌ Not a participant. Conversation exists:', !!conversation)
          console.log('[Pusher Auth] Current user:', currentUserProfile.id, currentUserProfile.username)
          if (conversation) {
            console.log('[Pusher Auth] Participants:', conversation.participants.map(p => ({ id: p.user.id, username: p.user.username })))
          }
        }
      }

      // 3. Deny all other channel subscriptions
      console.log('[Pusher Auth] ❌ Forbidden channel:', channel_name)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Pusher auth error:', error)
    }
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
