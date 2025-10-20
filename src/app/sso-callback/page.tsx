"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SsoCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
