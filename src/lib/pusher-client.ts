import Pusher from "pusher-js"

// Validate environment variables
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

if (!pusherKey || !pusherCluster) {
  throw new Error('Missing required Pusher environment variables')
}

// Enable Pusher logging only in development
if (process.env.NODE_ENV === 'development') {
  Pusher.logToConsole = true
}

export const pusherClient = new Pusher(pusherKey!, {
  cluster: pusherCluster!,
  forceTLS: true,
  channelAuthorization: {
    endpoint: "/api/pusher/auth",
    transport: "ajax",
    headers: {
      "Content-Type": "application/json",
    },
  },
  // Mobile-optimized settings
  activityTimeout: 30000, // 30 seconds
  pongTimeout: 10000, // 10 seconds
  // Enable faster reconnection for mobile
  enabledTransports: ['ws', 'wss'],
  disabledTransports: [],
})

// Auto-reconnect on disconnection
pusherClient.connection.bind('state_change', (states: { current: string }) => {
  if (states.current === 'disconnected' || states.current === 'failed') {
    setTimeout(() => {
      pusherClient.connect()
    }, 1000)
  }
})

// Error handling - only log critical errors in production
pusherClient.connection.bind('error', (err: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Pusher connection error:', err)
  }
})

// Mobile-specific: Handle page visibility changes
// Only enable on actual mobile devices, not desktop browsers
if (typeof document !== 'undefined' && typeof navigator !== 'undefined') {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isMobile) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const currentState = pusherClient.connection.state
        // Only reconnect if we're not already connected or connecting
        if (currentState !== 'connected' && currentState !== 'connecting') {
          pusherClient.connect()
        }
      }
    })
  }
  
  // Handle online/offline events for all devices
  window.addEventListener('online', () => {
    if (pusherClient.connection.state !== 'connected') {
      pusherClient.connect()
    }
  })
}
