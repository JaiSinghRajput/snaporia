"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

// Force dynamic rendering for this auth callback page
export const dynamic = 'force-dynamic'

export default function SsoCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
