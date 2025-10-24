"use client"

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileNotificationFAB() {
  const [show, setShow] = useState(false)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) return

    // Check if we should show the FAB
    const checkPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const dismissed = localStorage.getItem('notification-banner-dismissed')
        // Show FAB even if banner was dismissed, as a persistent option
        setShow(true)
      }
    }

    // Delay showing to avoid overwhelming user
    const timer = setTimeout(checkPermission, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleEnable = async () => {
    setEnabling(true)
    try {
      if (window.enablePushNotifications) {
        const success = await window.enablePushNotifications()
        if (success) {
          setShow(false)
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    } finally {
      setEnabling(false)
    }
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={handleEnable}
        disabled={enabling}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Enable notifications"
      >
        <Bell className={`w-6 h-6 ${enabling ? 'animate-bounce' : 'animate-pulse'}`} />
      </motion.button>
    </AnimatePresence>
  )
}
