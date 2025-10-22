import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getCurrentUserProfile } from '@/lib/user'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserProfile = await getCurrentUserProfile()
    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const body = await req.text()
    // pusher-js v8 sends body as form-encoded by default when using ajax, but we configured JSON later.
    let socket_id = ''
    let channel_name = ''

    try {
      const json = JSON.parse(body)
      socket_id = json.socket_id
      channel_name = json.channel_name
    } catch {
      // Fallback to x-www-form-urlencoded parsing
      const params = new URLSearchParams(body)
      socket_id = params.get('socket_id') || ''
      channel_name = params.get('channel_name') || ''
    }

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }

    // Only allow a user to subscribe to their own private channel
    const expected = `private-user-${currentUserProfile.id}`
    if (channel_name !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

  // Authorize the private channel
  const authResponse = pusherServer.authorizeChannel(socket_id, channel_name)

    return new NextResponse(JSON.stringify(authResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
