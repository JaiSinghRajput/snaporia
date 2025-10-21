'use client'

import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { pusherClient } from '@/lib/pusher-client'
import { Send, Loader2, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    username: string
    firstName: string
    lastName: string
    avatar: string | null
  }
}

interface OtherUser {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar: string | null
}

function formatTime(date: string) {
  const messageDate = new Date(date)
  return messageDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatDateSeparator(date: string) {
  const messageDate = new Date(date)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (messageDate.toDateString() === now.toDateString()) {
    return 'Today'
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

function shouldShowDateSeparator(currentMsg: Message, prevMsg: Message | null) {
  if (!prevMsg) return true
  const currentDate = new Date(currentMsg.createdAt).toDateString()
  const prevDate = new Date(prevMsg.createdAt).toDateString()
  return currentDate !== prevDate
}

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const { user } = useUser()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)


  // Only autoscroll if user is near the bottom or a new message is sent by the user
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }

  // Helper to check if user is near the bottom
  const isUserNearBottom = () => {
    const container = messagesEndRef.current?.parentElement
    if (!container) return true
    const threshold = 10 // px
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold
  }

  // Track if last message is from current user
  const lastMessageFromMe = messages.length > 0 && messages[messages.length - 1].senderId === currentUserId

  useEffect(() => {
    if (isUserNearBottom() || lastMessageFromMe) {
      scrollToBottom()
    }
    // else, do not autoscroll (user is reading older messages)
    // eslint-disable-next-line
  }, [messages])

  useEffect(() => {
    const fetchUserIdAndMessages = async () => {
      try {
        // Fetch current user's database ID from backend
        const userRes = await fetch('/api/users/me')
        if (!userRes.ok) throw new Error('Failed to fetch user ID')
        const userData = await userRes.json()
        const dbUserId = userData.userId as string
        setCurrentUserId(dbUserId)

        // Fetch messages
        const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
        if (!res.ok) throw new Error('Failed to fetch messages')
        const data = await res.json()
        const messagesList = data.messages || []
        setMessages(messagesList)

        // Debug log to verify IDs
        console.log('Current user database ID:', dbUserId)
        if (messagesList.length > 0) {
          console.log('First message senderId:', messagesList[0].senderId)
          console.log('IDs match:', messagesList[0].senderId === dbUserId)
        }

        // Extract other user from messages
        if (messagesList.length > 0) {
          const firstOtherMessage = messagesList.find(
            (m: Message) => m.senderId !== dbUserId
          )
          if (firstOtherMessage) {
            setOtherUser(firstOtherMessage.sender)
          }
        }
      } catch (error) {
        console.error('Error fetching user ID or messages:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserIdAndMessages()

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe(`conversation-${conversationId}`)
    channel.bind('new-message', (data: Message) => {
      setMessages((prev) => [...prev, data])
      if (!otherUser && currentUserId && data.senderId !== currentUserId) {
        setOtherUser(data.sender)
      }
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [conversationId, otherUser, currentUserId])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim()
        })
      })

      if (!res.ok) throw new Error('Failed to send message')

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading || !currentUserId) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  const displayName = otherUser 
    ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.username
    : 'User'

  return (
  <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-900">
      {/* Responsive Header */}
  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 shadow-lg z-30 sticky top-16 min-h-[56px] sm:min-h-[64px]">
        <button 
          onClick={() => router.back()} 
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div 
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => otherUser && router.push(`/profile/${otherUser.username}`)}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/30">
            {otherUser?.avatar ? (
              <Image
                src={otherUser.avatar}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold text-lg">
                {displayName[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-base truncate">{displayName}</h2>
            <p className="text-xs text-white/80">Click to view profile</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

  {/* Messages Container */}
  <div className="flex-1 overflow-y-auto px-1 sm:px-4 py-2 sm:py-4 space-y-2 sm:space-y-3 bg-gray-50 dark:bg-gray-800" style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 sm:p-8 bg-white dark:bg-gray-700 rounded-2xl shadow-lg max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Send className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-700 dark:text-gray-200 font-medium text-sm sm:text-base">No messages yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2">Say hi to start the conversation! 👋</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId
            const prevMessage = index > 0 ? messages[index - 1] : null
            const showDateSeparator = shouldShowDateSeparator(message, prevMessage)

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`flex ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`relative max-w-[90%] sm:max-w-[70%] ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tl-xl rounded-tr-2xl rounded-bl-2xl'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-2xl rounded-tr-xl rounded-br-2xl shadow-sm'
                    } px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base break-words whitespace-pre-wrap leading-relaxed`}
                    style={{ wordBreak: 'break-word', transition: 'background 0.2s' }}
                  >
                    {/* Show sender name for received messages */}
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                        {message.sender.firstName} {message.sender.lastName}
                      </p>
                    )}

                    {/* Message Content */}
                    <p className="text-sm sm:text-base break-words whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center justify-end mt-1">
                      <span className={`text-[10px] ${
                        isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Input Area for Mobile */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 sticky bottom-0 z-40" style={{ boxShadow: '0 -2px 8px 0 rgba(0,0,0,0.03)' }}>
        <form className="flex items-center gap-2 max-w-4xl mx-auto" onSubmit={e => { e.preventDefault(); sendMessage(); }} autoComplete="off">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transition-all"
            style={{ minHeight: 40 }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : (
              <Send className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
