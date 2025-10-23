"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"

export default function RefreshButton({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
      title="Refresh messages"
    >
      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
    </button>
  )
}
