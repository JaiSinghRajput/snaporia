"use client"

import { useState, useCallback } from "react"
import { RefreshCw } from "lucide-react"

export default function ChatRefreshButton({ conversationId }: { conversationId: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Force reload the page to get fresh data
      window.location.reload()
    } catch (error) {
      console.error('Error refreshing:', error)
      setIsRefreshing(false)
    }
  }, [])

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
      title="Refresh messages"
      aria-label="Refresh messages"
    >
      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  )
}
