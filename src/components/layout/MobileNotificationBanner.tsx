"use client"

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

export default function MobileNotificationBanner() {
  const [show, setShow] = useState(false)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) return

    // Check if we should show the banner
    const checkPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const dismissed = localStorage.getItem('notification-banner-dismissed')
        if (!dismissed) {
          setShow(true)
        }
      }
    }

    checkPermission()

    // Also check on visibility change (when user returns to the app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPermission()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const handleEnable = async () => {
    setEnabling(true)
    try {
      if (window.enablePushNotifications) {
        const success = await window.enablePushNotifications()
        if (success) {
          setShow(false)
          localStorage.setItem('notification-banner-dismissed', 'true')
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setEnabling(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('notification-banner-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="md:hidden sticky top-0 z-40 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">
            Stay connected with notifications
          </p>
          <p className="text-xs opacity-90 mb-3">
            Get instant alerts for new messages and updates
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={enabling}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-gray-100 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enabling ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-white/90 hover:text-white text-sm"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
