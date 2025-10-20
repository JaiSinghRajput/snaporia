import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const { userId } = await auth()
    console.log('🔍 Profile sync - userId:', userId)
    
    if (!userId) {
      console.error('❌ Profile sync - No userId from auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    console.log('🔍 Profile sync - currentUser:', {
      id: user?.id,
      username: user?.username,
      email: user?.emailAddresses?.[0]?.emailAddress,
      firstName: user?.firstName,
      lastName: user?.lastName,
    })
    
    if (!user) {
      console.error('❌ Profile sync - No Clerk user returned')
      return NextResponse.json({ error: 'No Clerk user' }, { status: 400 })
    }

    const email = user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress
    const baseUsername = user.username || (email ? email.split('@')[0] : undefined)
    const fallback = `user_${user.id.slice(-6)}`
    const username = baseUsername ? `${baseUsername}` : fallback

    console.log('🔍 Profile sync - Attempting upsert with username:', username)

    const profile = await prisma.userProfile.upsert({
      where: { clerkUserId: user.id },
      update: {
        email: email || undefined,
        username,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        avatar: user.imageUrl ?? null,
      },
      create: {
        clerkUserId: user.id,
        email: email || `${fallback}@example.com`,
        username,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        avatar: user.imageUrl ?? null,
      },
    })

    console.log('✅ Profile sync success:', profile.username, profile.id)
    return NextResponse.json({ ok: true, profile })
  } catch (err) {
    console.error('❌ Profile sync error:', err)
    return NextResponse.json({ 
      error: 'Profile sync failed', 
      details: err instanceof Error ? err.message : String(err) 
    }, { status: 500 })
  }
}
