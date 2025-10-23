"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

export default function MessageInput({
  conversationId,
  currentUserId,
  onMessageSent
}: {
  conversationId: string
  currentUserId: string
  onMessageSent?: (message: {
    id: string
    tempId?: string
    content: string
    senderId: string
    status: 'pending' | 'sent' | 'read' | 'failed'
    createdAt: string
    sender: { id: string; username: string; firstName: string; lastName: string; avatar: string | null } | null
  }) => void
}) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleSend = async () => {
    if (!message.trim()) return

    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: message.trim(),
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      sender: null, // Will be populated from context
      status: 'pending' as const
    }

    // Immediately show message as pending
    if (onMessageSent) {
      onMessageSent(tempMessage)
    }

    const messageContent = message.trim()
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageContent
        })
      })

      if (!res.ok) throw new Error('Failed to send message')
      
      const data = await res.json()
      
      // Update message status to sent
      if (onMessageSent && data.message) {
        onMessageSent({ ...data.message, status: 'sent', tempId: tempMessage.id })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Update message status to failed
      if (onMessageSent) {
        onMessageSent({ ...tempMessage, status: 'failed' })
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="flex-shrink-0 w-11 h-11 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 transition-all"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      
      {/* Hints */}
      <div className="flex items-center justify-center mt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
