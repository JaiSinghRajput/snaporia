"use client"

import { useEffect, useState } from 'react'
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function NotificationDebugPage() {
  const [status, setStatus] = useState<{
    swRegistered: boolean
    swActive: boolean
    notificationSupport: boolean
    notificationPermission: string
    pushSubscription: PushSubscription | null
    vapidKey: string
    subscriptionCount: number
  }>({
    swRegistered: false,
    swActive: false,
    notificationSupport: false,
    notificationPermission: 'unknown',
    pushSubscription: null,
    vapidKey: '',
    subscriptionCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    try {
      const swRegistered = 'serviceWorker' in navigator
      let swActive = false
      let pushSubscription = null

      if (swRegistered) {
        const registration = await navigator.serviceWorker.getRegistration()
        swActive = !!registration?.active
        if (registration) {
          pushSubscription = await registration.pushManager.getSubscription()
        }
      }

      const notificationSupport = 'Notification' in window
      const notificationPermission = notificationSupport ? Notification.permission : 'not-supported'
      
      // Get VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'NOT SET'

      // Check subscription count in DB
      const response = await fetch('/api/notifications/subscription-count')
      const subscriptionCount = response.ok ? (await response.json()).count : 0

      setStatus({
        swRegistered,
        swActive,
        notificationSupport,
        notificationPermission,
        pushSubscription,
        vapidKey,
        subscriptionCount
      })
    } catch (error) {
      console.error('Status check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const enableNotifications = async () => {
    setTestResult('Requesting permission...')
    try {
      if (window.enablePushNotifications) {
        const success = await window.enablePushNotifications()
        if (success) {
          setTestResult('✅ Notifications enabled successfully!')
          await checkStatus()
        } else {
          setTestResult('❌ Failed to enable notifications. Check console.')
        }
      } else {
        setTestResult('❌ enablePushNotifications function not available')
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`)
    }
  }

  const testNotification = async () => {
    setTestResult('Sending test notification...')
    try {
      if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Test Notification', {
          body: 'This is a test notification from Snaporia',
          icon: '/icons/android/android-launchericon-96-96.png',
          badge: '/icons/android/android-launchericon-48-48.png',
        })
        setTestResult('✅ Test notification sent!')
      } else {
        setTestResult('❌ Permission not granted')
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error}`)
    }
  }

  const StatusIcon = ({ condition }: { condition: boolean }) => (
    condition ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Bell className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Push Notifications Debug
            </h1>
          </div>

          {/* Status Checks */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Status</h2>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={status.swRegistered} />
              <span className="text-gray-900 dark:text-white">Service Worker Support</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={status.swActive} />
              <span className="text-gray-900 dark:text-white">Service Worker Active</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={status.notificationSupport} />
              <span className="text-gray-900 dark:text-white">Notification API Support</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={status.notificationPermission === 'granted'} />
              <span className="text-gray-900 dark:text-white">
                Notification Permission: <strong>{status.notificationPermission}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={!!status.pushSubscription} />
              <span className="text-gray-900 dark:text-white">Push Subscription Active</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <StatusIcon condition={status.vapidKey !== 'NOT SET'} />
              <span className="text-gray-900 dark:text-white">VAPID Key Configured</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-500" />
              <span className="text-gray-900 dark:text-white">
                Subscriptions in Database: <strong>{status.subscriptionCount}</strong>
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">VAPID Public Key:</p>
              <code className="text-xs text-gray-900 dark:text-white break-all">
                {status.vapidKey}
              </code>
            </div>

            {status.pushSubscription && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Subscription Endpoint:</p>
                <code className="text-xs text-gray-900 dark:text-white break-all">
                  {status.pushSubscription.endpoint}
                </code>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={enableNotifications}
                disabled={status.notificationPermission === 'granted'}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable Notifications
              </button>

              <button
                onClick={testNotification}
                disabled={status.notificationPermission !== 'granted'}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Test Local Notification
              </button>

              <button
                onClick={checkStatus}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Refresh Status
              </button>
            </div>

            {testResult && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-900 dark:text-blue-200">{testResult}</p>
              </div>
            )}
          </div>

          {/* Troubleshooting */}
          <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
              Troubleshooting Tips
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li>• If Service Worker isn&apos;t active, try hard refreshing (Ctrl+Shift+R)</li>
              <li>• If VAPID key shows &quot;NOT SET&quot;, add NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local and restart dev server</li>
              <li>• If permission is &quot;denied&quot;, reset it in browser site settings</li>
              <li>• On iOS, notifications only work for apps added to Home Screen (PWA)</li>
              <li>• Check browser console for detailed logs and errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
