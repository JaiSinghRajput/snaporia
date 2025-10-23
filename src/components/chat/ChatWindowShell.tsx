"use client"

import { useState } from "react"
import MessageThread from "./MessageThread"
import MessageInput from "./MessageInput"

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

export default function ChatWindowShell({
  conversationId,
  currentUserId,
  currentUser,
  otherUser
}: {
  conversationId: string
  currentUserId: string
  currentUser?: UserProfile
  otherUser?: UserProfile
}) {
  const [optimisticMsg, setOptimisticMsg] = useState<Message | null>(null)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        currentUser={currentUser}
        otherUser={otherUser}
        externalMessage={optimisticMsg}
      />
      <MessageInput
        conversationId={conversationId}
        currentUserId={currentUserId}
        onMessageSent={(m) => setOptimisticMsg(m)}
      />
    </div>
  )
}
