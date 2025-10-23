"use client"

import { useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface CommentsDrawerProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

interface CommentItem {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
  }
  replies: CommentItem[]
  _count: { replies: number }
}

export default function CommentsDrawer({ postId, isOpen, onClose }: CommentsDrawerProps) {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const fetchComments = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      if (!res.ok) throw new Error('Failed to load comments')
      const data = await res.json()
      setComments(data.comments || [])
    } catch (e) {
      setError('Could not load comments')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    const text = input.trim()
    if (!text) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setComments([data.comment, ...comments])
      setInput("")
    } catch (e) {
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transition-transform ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold">Comments</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

  <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-4 space-y-4" style={{ overflowAnchor: 'none' }}>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.user.avatar ? (
                  <Image src={c.user.avatar} alt={c.user.username} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-700 flex items-center justify-center font-bold">
                    {c.user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm"><span className="font-semibold">@{c.user.username}</span> {c.content}</p>
                  {c.replies?.length > 0 && (
                    <div className="mt-2 pl-4 border-l border-gray-200 dark:border-gray-800 space-y-2">
                      {c.replies.map((r) => (
                        <p key={r.id} className="text-sm"><span className="font-semibold">@{r.user.username}</span> {r.content}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            placeholder="Write a comment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
          <Button disabled={submitting || !input.trim()} onClick={submit} className="gap-2">
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
