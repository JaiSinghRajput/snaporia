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
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    register()
  }, [])

  return null
}
