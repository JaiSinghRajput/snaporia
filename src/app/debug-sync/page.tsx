"use client"

import { useState } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function DebugSyncPage() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/profile/sync', { method: 'POST' })
      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profile Sync Debug</h1>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Clerk Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Signed In:</strong> {String(isSignedIn)}</p>
            <p><strong>User ID:</strong> {userId || 'null'}</p>
            <p><strong>Username:</strong> {user?.username || 'null'}</p>
            <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'null'}</p>
            <p><strong>First Name:</strong> {user?.firstName || 'null'}</p>
            <p><strong>Last Name:</strong> {user?.lastName || 'null'}</p>
          </div>
        </div>

        <Button onClick={handleSync} disabled={loading || !isSignedIn} size="lg">
          {loading ? 'Syncing...' : 'Manually Trigger Profile Sync'}
        </Button>

        {result && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <pre className="text-xs overflow-auto bg-gray-100 dark:bg-gray-800 p-4 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
