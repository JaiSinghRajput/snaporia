"use client"

import { useEffect, useState } from "react"
import { pusherClient } from "@/lib/pusher-client"
import { WifiOff, Loader2 } from "lucide-react"

export default function PusherStatus() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting')

  useEffect(() => {
    const updateStatus = (states: { current: 'connecting' | 'connected' | 'disconnected' | 'failed' }) => {
      setStatus(states.current)
    }

    pusherClient.connection.bind('state_change', updateStatus)
    
    // Set initial state
    const currentState = pusherClient.connection.state as 'connecting' | 'connected' | 'disconnected' | 'failed'
    setStatus(currentState)

    return () => {
      pusherClient.connection.unbind('state_change', updateStatus)
    }
  }, [])

  // Don't show anything if connected (normal state)
  if (status === 'connected') return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
        status === 'connecting' ? 'bg-yellow-500 text-white' :
        status === 'disconnected' ? 'bg-orange-500 text-white' :
        status === 'failed' ? 'bg-red-500 text-white' :
        'bg-green-500 text-white'
      }`}>
        {status === 'connecting' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to chat...</span>
          </>
        )}
        {status === 'disconnected' && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Chat disconnected</span>
          </>
        )}
        {status === 'failed' && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Chat connection failed</span>
          </>
        )}
      </div>
    </div>
  )
}
