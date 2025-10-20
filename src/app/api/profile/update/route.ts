import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updateUserProfile, getCurrentUserProfile } from '@/lib/user'

/**
 * POST /api/profile/update
 * Update current user's profile
 */
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

    const body = await req.json()
    const { bio, location, website, dateOfBirth, isPrivate } = body

    // Update only allowed fields
    const updatedProfile = await updateUserProfile(currentUserProfile.id, {
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
      ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
      ...(isPrivate !== undefined && { isPrivate }),
    })

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

/**
 * GET /api/profile
 * Get current user's profile for edit page prefill
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserProfile = await getCurrentUserProfile()
    if (!currentUserProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    return NextResponse.json({ profile: currentUserProfile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
