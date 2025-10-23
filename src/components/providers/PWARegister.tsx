"use client"

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready
        
        console.log('✅ Service Worker registered successfully:', registration.scope)
        
        // Update on reload
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('✅ Service Worker activated')
              }
            })
          }
        })

        // Attempt background push subscription if already granted
        if (Notification.permission === 'granted') {
          try {
            await subscribeToPush(registration)
          } catch (e) {
            console.warn('Push subscription failed:', e)
          }
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    register()
  }, [])

  return null
}

async function subscribeToPush(registration: ServiceWorkerRegistration) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    console.warn('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY')
    return
  }
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  // Get existing subscription or create new
  let sub = await registration.pushManager.getSubscription()
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
  }

  // Send to backend
  await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  })
}

declare global {
  interface Window {
    enablePushNotifications?: () => Promise<boolean>
  }
}

// Provide a global helper to enable push on user action if needed
if (typeof window !== 'undefined') {
  window.enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator)) return false
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    const reg = await navigator.serviceWorker.ready
    await subscribeToPush(reg)
    return true
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
