"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MessageCircle, Search, Loader2 } from "lucide-react"

interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  avatar: string | null
  isOwn?: boolean
}

interface Participant {
  id: string
  userId: string
  user: User
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
}

interface Conversation {
  id: string
  isGroup: boolean
  groupName: string | null
  messages: Message[]
  participants: Participant[]
  lastMessageAt: string | null
}

interface ConversationItem {
  conversation: Conversation
}

function formatMessageTime(date: string) {
  const messageDate = new Date(date)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    })
  }
}

export default function ChatList() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch("/api/chat/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations || []))
      .catch((error) => console.error('Error fetching conversations:', error))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    )
  }

  const filteredConversations = conversations.filter((c) => {
    const other = c.conversation.participants.find((p) => !p.user.isOwn)
    const name = other ? `${other.user.firstName} ${other.user.lastName} ${other.user.username}`.toLowerCase() : ''
    return name.includes(searchQuery.toLowerCase())
  })

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4 bg-white dark:bg-gray-900">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No conversations yet</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
          Start chatting by visiting a user&apos;s profile and clicking the Message button
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Sticky Header + Search Bar */}
      <div className="sticky top-16 z-30 bg-white dark:bg-gray-900">
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all"
              style={{ minHeight: 40 }}
            />
          </div>
        </div>
      </div>

  {/* Conversations List */}
  <div className="flex-1 overflow-y-auto pb-2 sm:pb-4 pt-[82px] sm:pt-[65px]">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const convo = c.conversation
            const lastMsg = convo.messages[0]
            const other = convo.participants.find((p) => !p.user.isOwn)
            const displayName = other 
              ? `${other.user.firstName} ${other.user.lastName}`.trim() || other.user.username
              : convo.groupName || "Group Chat"

            return (
              <div
                key={convo.id}
                onClick={() => router.push(`/messages/${convo.id}`)}
                className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 active:bg-gray-100 dark:active:bg-gray-700 min-h-[60px] sm:min-h-[72px]"
                style={{ touchAction: 'manipulation' }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-gray-200 dark:ring-gray-700">
                    {other?.user.avatar ? (
                      <Image
                        src={other.user.avatar}
                        alt={displayName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xl">
                        {displayName[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Online indicator - you can implement this later */}
                  {/* <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" /> */}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base">
                      {displayName}
                    </h3>
                    {lastMsg && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatMessageTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                    {lastMsg ? lastMsg.content : "No messages yet"}
                  </p>
                </div>

                {/* Unread badge - you can implement this later */}
                {/* <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-xs text-white font-semibold">3</span>
                  </div>
                </div> */}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
