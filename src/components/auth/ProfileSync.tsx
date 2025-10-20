"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'

export default function ProfileSync() {
  const { isSignedIn } = useAuth()
  const attempted = useRef(false)

  useEffect(() => {
    if (!isSignedIn) return
    if (attempted.current) return
    const key = 'profile-sync-done'
    if (sessionStorage.getItem(key)) return

    attempted.current = true
    fetch('/api/profile/sync', { method: 'POST' })
      .then((res) => {
        if (!res.ok) {
          console.error('ProfileSync failed:', res.status, res.statusText)
          return res.json().then((data) => {
            console.error('ProfileSync error details:', data)
          })
        }
        return res.json().then((data) => {
          console.log('✅ Profile synced:', data.profile?.username)
        })
      })
      .catch((err) => {
        console.error('ProfileSync network error:', err)
      })
      .finally(() => {
        sessionStorage.setItem(key, '1')
      })
  }, [isSignedIn])

  return null
}
