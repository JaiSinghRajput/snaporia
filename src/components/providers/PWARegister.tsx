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
        console.log('🔔 Notification permission:', Notification.permission)
        if (Notification.permission === 'granted') {
          try {
            await subscribeToPush(registration)
          } catch (e) {
            console.error('❌ Push subscription failed:', e)
          }
        } else if (Notification.permission === 'default') {
          console.log('ℹ️ Notification permission not yet requested. Click "Enable notifications" to allow.')
        } else {
          console.warn('⚠️ Notification permission denied. Check browser settings.')
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
  // Access env var - Next.js replaces process.env.NEXT_PUBLIC_* at build time
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  
  if (!vapidPublicKey) {
    console.error('❌ Missing VAPID public key. Ensure NEXT_PUBLIC_VAPID_PUBLIC_KEY is in .env.local and restart dev server')
    return
  }
  
  console.log('🔑 Subscribing to push with VAPID key:', vapidPublicKey.substring(0, 20) + '...')
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

  // Get existing subscription or create new
  let sub = await registration.pushManager.getSubscription()
  if (!sub) {
    console.log('📱 Creating new push subscription...')
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
    console.log('✅ Push subscription created')
  } else {
    console.log('✅ Using existing push subscription')
  }

  // Send to backend
  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  })
  
  if (response.ok) {
    console.log('✅ Push subscription saved to server')
  } else {
    const error = await response.text()
    console.error('❌ Failed to save push subscription:', error)
  }
}

declare global {
  interface Window {
    enablePushNotifications?: () => Promise<boolean>
  }
}

// Provide a global helper to enable push on user action if needed
if (typeof window !== 'undefined') {
  window.enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Worker not supported')
      return false
    }
    
    console.log('🔔 Requesting notification permission...')
    const permission = await Notification.requestPermission()
    console.log('🔔 Permission result:', permission)
    
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted')
      return false
    }
    
    try {
      const reg = await navigator.serviceWorker.ready
      await subscribeToPush(reg)
      console.log('✅ Push notifications enabled successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to enable push notifications:', error)
      return false
    }
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
