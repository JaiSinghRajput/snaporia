import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Clerk Webhook Handler
 * This automatically creates a UserProfile when a user signs up via Clerk
 * 
 * Setup Instructions:
 * 1. Go to Clerk Dashboard > Webhooks
 * 2. Add endpoint: https://yourdomain.com/api/webhooks/clerk
 * 3. Subscribe to: user.created, user.updated, user.deleted
 * 4. Copy the signing secret to .env as CLERK_WEBHOOK_SECRET
 */

export async function POST(req: Request) {
  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    // Generate a username if not provided
    const generatedUsername =
      username || email_addresses[0].email_address.split('@')[0] + '_' + id.slice(-4)

    try {
      // Create user profile in database
      await prisma.userProfile.create({
        data: {
          clerkUserId: id,
          email: email_addresses[0].email_address,
          username: generatedUsername,
          firstName: first_name || null,
          lastName: last_name || null,
          avatar: image_url || null,
        },
      })

      console.log('✅ User profile created:', generatedUsername)
    } catch (error) {
      console.error('Error creating user profile:', error)
      return new Response('Error: Failed to create user profile', {
        status: 500,
      })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data

    try {
      // Update user profile in database
      await prisma.userProfile.update({
        where: { clerkUserId: id },
        data: {
          email: email_addresses[0].email_address,
          username: username || undefined,
          firstName: first_name || null,
          lastName: last_name || null,
          avatar: image_url || null,
        },
      })

      console.log('✅ User profile updated:', username)
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      // Delete user profile (this will cascade delete all related data)
      await prisma.userProfile.delete({
        where: { clerkUserId: id! },
      })

      console.log('✅ User profile deleted:', id)
    } catch (error) {
      console.error('Error deleting user profile:', error)
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}
