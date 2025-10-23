"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Search, Loader2, MessageCircle, User } from "lucide-react"
import { pusherClient } from "@/lib/pusher-client"

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar: string | null
}

interface LastMessage {
  id: string
  content: string
  senderId: string
  createdAt: string
}

interface Conversation {
  id: string
  isGroup: boolean
  groupName: string | null
  groupImage: string | null
  lastMessageAt: string
  participants: {
    user: UserProfile
  }[]
  messages: LastMessage[]
  unreadCount?: number
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConversationList({ currentUserId }: { currentUserId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only load conversations if not already initialized
    if (!isInitialized) {
      loadConversations()
    }
  }, [isInitialized])

  // Mobile: Refresh conversations when page becomes visible
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) return
    
    let wasHidden = false
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true
      } else if (document.visibilityState === 'visible' && wasHidden && isInitialized) {
        setTimeout(() => {
          loadConversations()
        }, 500)
        wasHidden = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isInitialized])

  // Subscribe per-conversation to their channels to receive message previews in realtime
  useEffect(() => {
    if (!conversations.length) return

    const channels = conversations.map(c => {
      const ch = pusherClient.subscribe(`private-conversation-${c.id}`)
      ch.bind('new-message', (message: LastMessage) => {
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.id === c.id) {
              return {
                ...conv,
                messages: [message],
                lastMessageAt: message.createdAt,
                unreadCount: (pathname?.includes(conv.id) ? 0 : (conv.unreadCount || 0) + 1)
              }
            }
            return conv
          })
          return updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
        })
      })
      return ch
    })

    return () => {
      channels.forEach(ch => { ch.unbind_all(); ch.unsubscribe() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.map(c => c.id).join(','), pathname])

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations')
      if (!res.ok) throw new Error('Failed to load conversations')
      const data = await res.json()
      setConversations(data.conversations || [])
      setIsInitialized(true)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading conversations:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    // Safely access participants
    const otherUser = conv.participants?.[0]?.user
    if (!otherUser) return false
    const name = `${otherUser.firstName} ${otherUser.lastName} ${otherUser.username}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ overflowAnchor: 'none' }}>
        {filteredConversations.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {searchQuery ? 'Try a different search term' : 'Start a conversation from a user\'s profile'}
            </p>
          </div>
        )}

        {filteredConversations.map(conv => {
          const otherUser = conv.participants?.[0]?.user
          const lastMessage = conv.messages?.[0]
          const isActive = pathname?.includes(conv.id)
          
          // Skip if no participants data
          if (!otherUser) return null
          
          return (
            <div
              key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                  {otherUser?.avatar ? (
                    <Image
                      src={otherUser.avatar}
                      alt={otherUser.username}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                      {otherUser?.firstName?.[0] || <User className="w-6 h-6" />}
                    </div>
                  )}
                </div>
                {/* Online indicator - can implement later */}
                {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" /> */}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className={`font-semibold truncate text-sm ${
                    conv.unreadCount && conv.unreadCount > 0 
                      ? 'text-gray-900 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {otherUser 
                      ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.username
                      : conv.groupName || 'Unknown'}
                  </h3>
                  <span suppressHydrationWarning className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                    {formatTime(lastMessage?.createdAt || conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm truncate ${
                    conv.unreadCount && conv.unreadCount > 0
                      ? 'text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {lastMessage?.content || 'No messages yet'}
                  </p>
                  {conv.unreadCount && conv.unreadCount > 0 && (
                    <div className="ml-2 flex-shrink-0 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-semibold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
