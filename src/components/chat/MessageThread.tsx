"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Loader2, User, Check, CheckCheck, Clock, AlertCircle } from "lucide-react"
import { pusherClient } from "@/lib/pusher-client"

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar: string | null
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: UserProfile | null
  status?: 'pending' | 'sent' | 'read' | 'failed'
  tempId?: string
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatDateSeparator(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

function shouldShowDateSeparator(currentMsg: Message, prevMsg: Message | null) {
  if (!prevMsg) return true
  const currentDate = new Date(currentMsg.createdAt).toDateString()
  const prevDate = new Date(prevMsg.createdAt).toDateString()
  return currentDate !== prevDate
}

function shouldGroupMessages(currentMsg: Message, prevMsg: Message | null) {
  if (!prevMsg) return false
  if (currentMsg.senderId !== prevMsg.senderId) return false
  
  const timeDiff = new Date(currentMsg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()
  return timeDiff < 60000 // Group if less than 1 minute apart
}

export default function MessageThread({ 
  conversationId, 
  currentUserId,
  currentUser,
  otherUser,
  externalMessage
}: { 
  conversationId: string
  currentUserId: string
  currentUser?: UserProfile
  otherUser?: UserProfile
  externalMessage?: Message | null
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)
  const channelRef = useRef<ReturnType<typeof pusherClient.subscribe> | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      
      // Only auto-scroll if user is near the bottom (within 150px)
      if (isNearBottom || lastMessageCountRef.current === 0) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight
        }, 100)
      }
    }
    lastMessageCountRef.current = messages.length
  }, [messages.length])

  useEffect(() => {
    loadMessages()
  }, [conversationId])

  // Subscribe to real-time messages and read receipts
  useEffect(() => {
    const channel = pusherClient.subscribe(`private-conversation-${conversationId}`)
    
    channel.bind('new-message', (message: Message) => {
      setMessages(prev => {
        // Deduplicate - check if we already have this message
        if (prev.some(m => m.id === message.id)) {
          return prev
        }
        
        // Remove any pending messages with temp IDs from the same sender
        const filtered = prev.filter(m => {
          if (m.status !== 'pending') return true
          if (m.senderId !== message.senderId) return true
          return false
        })
        
        const newMessages = [...filtered, { ...message, status: message.status || 'sent' }]
        
        // Sort by creation date to maintain order
        return newMessages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })

      // Mark new incoming message as read immediately
      if (message.senderId !== currentUserId) {
        setTimeout(() => {
          markMessagesAsRead([message.id])
        }, 100)
      }
    })

    // Listen for read receipts
    channel.bind('messages-read', (data: { readBy: string; messageIds: string[] }) => {
      if (data.readBy === currentUserId) return
      
      setMessages(prev => 
        prev.map(m => 
          data.messageIds.includes(m.id) && m.senderId === currentUserId
            ? { ...m, status: 'read' as const }
            : m
        )
      )
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [conversationId, currentUserId])

  // Mobile: Handle page visibility changes to reload messages
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (!isMobile) return
    
    let wasHidden = false
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true
      } else if (document.visibilityState === 'visible' && wasHidden) {
        setTimeout(() => {
          loadMessages()
        }, 500)
        wasHidden = false
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [conversationId])

  // Mark existing unread messages as read when messages are loaded
  useEffect(() => {
    if (messages.length === 0 || loading) return
    
    const unreadMessageIds = messages
      .filter(m => m.senderId !== currentUserId && m.status !== 'read')
      .map(m => m.id)
    
    if (unreadMessageIds.length > 0) {
      setTimeout(() => {
        markMessagesAsRead(unreadMessageIds)
      }, 500)
    }
  }, [conversationId])

  const markMessagesAsRead = async (messageIds: string[]) => {
    if (!messageIds || messageIds.length === 0) return
    
    try {
      await fetch('/api/chat/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, messageIds })
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error marking messages as read:', error)
      }
    }
  }

  // Handle externally provided message (optimistic send or status update)
  useEffect(() => {
    if (!externalMessage) return
    
    setMessages(prev => {
      // If this message has a tempId, it's replacing a pending message
      if (externalMessage.tempId) {
        return prev.map(m => 
          m.id === externalMessage.tempId 
            ? { ...externalMessage, sender: externalMessage.sender || m.sender }
            : m
        )
      }
      
      // Add sender info if not present
      const messageWithSender = {
        ...externalMessage,
        sender: externalMessage.sender || currentUser || null
      }
      
      // Check if we already have this message
      const existingIndex = prev.findIndex(m => m.id === externalMessage.id)
      if (existingIndex !== -1) {
        // Update existing message status
        return prev.map(m => 
          m.id === externalMessage.id 
            ? { ...m, ...messageWithSender }
            : m
        )
      }
      
      // Add new message and sort
      const newMessages = [...prev, messageWithSender]
      return newMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage?.id, externalMessage?.status, externalMessage?.tempId])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading messages:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-1 overscroll-contain" 
      style={{ overflowAnchor: 'none' }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">Start the conversation</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Say hi to {otherUser ? `${otherUser.firstName}` : 'them'}! 👋
            </p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => {
          const isOwnMessage = message.senderId === currentUserId
          const prevMessage = index > 0 ? messages[index - 1] : null
          const showDateSeparator = shouldShowDateSeparator(message, prevMessage)
          const isGrouped = shouldGroupMessages(message, prevMessage)

          return (
            <div key={message.id}>
              {/* Date Separator */}
              {showDateSeparator && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-4'}`}>
                {/* Avatar for received messages */}
                {!isOwnMessage && !isGrouped && message.sender && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
                    {message.sender.avatar ? (
                      <Image
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                        {message.sender.firstName?.[0] || <User className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Spacer for grouped messages */}
                {!isOwnMessage && isGrouped && <div className="w-8 flex-shrink-0" />}

                {/* Message Content */}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {/* Sender name for received non-grouped messages */}
                  {!isOwnMessage && !isGrouped && message.sender && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-1">
                      {message.sender.firstName} {message.sender.lastName}
                    </span>
                  )}
                  
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      isOwnMessage
                        ? `bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm ${
                            message.status === 'pending' ? 'opacity-60' : ''
                          } ${message.status === 'failed' ? 'opacity-50' : ''}`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Timestamp and Status */}
                  <div className={`flex items-center gap-1 mt-1 ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
                    <span suppressHydrationWarning className={`text-[10px] ${
                      isOwnMessage ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {formatTime(message.createdAt)}
                    </span>
                    
                    {/* Status indicators for own messages */}
                    {isOwnMessage && (
                      <span className="flex items-center" title={
                        message.status === 'pending' ? 'Sending...' :
                        message.status === 'failed' ? 'Failed to send' :
                        message.status === 'sent' ? 'Sent' :
                        message.status === 'read' ? 'Read' : 'Delivered'
                      }>
                        {message.status === 'pending' && (
                          <Clock className="w-3 h-3 text-gray-400" />
                        )}
                        {message.status === 'failed' && (
                          <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                        {message.status === 'sent' && (
                          <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {message.status === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        {!message.status && (
                          <Check className="w-3 h-3 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
