"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Toast from '@/components/ui/toast'

type User = {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
}

type Comment = {
  id: string
  content: string
  createdAt: string
  user: User
  replies: Array<Omit<Comment, 'replies'> & { replies?: never }>
  _count: { replies: number }
}

function formatTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  return date.toLocaleDateString()
}

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [canComment, setCanComment] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  useEffect(() => {
    // detect auth; non-blocking for comments listing
    fetch('/api/users/me').then(async (res) => {
      setCanComment(res.ok)
    }).catch(() => setCanComment(false))
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/posts/${postId}/comments`)
        if (!res.ok) throw new Error('Failed to load comments')
        const data = await res.json()
        const mapped: Comment[] = (data.comments || []).map((c: any) => ({
          ...c,
          createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
          replies: (c.replies || []).map((r: any) => ({
            ...r,
            createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
          })),
        }))
        setComments(mapped)
      } catch (e) {
        setError('Unable to load comments')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [postId])

  const submit = async () => {
    const content = newComment.trim()
    if (!content) return
    setPosting(true)
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.status === 401) {
        setToastMsg('Please sign in to comment')
        setShowToast(true)
        return
      }
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const c: Comment = {
        ...data.comment,
        createdAt: typeof data.comment.createdAt === 'string' ? data.comment.createdAt : new Date(data.comment.createdAt).toISOString(),
        replies: [],
      }
      setComments((prev) => [c, ...prev])
      setNewComment('')
    } catch (e) {
      setToastMsg('Failed to post comment')
      setShowToast(true)
    } finally {
      setPosting(false)
    }
  }

  const submitReply = async (parentId: string) => {
    const content = (replyText[parentId] || '').trim()
    if (!content) return
    try {
      // Optimistic disable UI state can be added if desired
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      })
      if (res.status === 401) {
        setToastMsg('Please sign in to reply')
        setShowToast(true)
        return
      }
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const r: any = data.comment
      type FlatReply = Omit<Comment, 'replies'>
      const newReply: FlatReply = {
        ...r,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
      }

      // Insert under the appropriate top-level thread
      setComments((prev) => {
        // If replying to a top-level comment, parentId matches comment.id
        if (prev.some((c) => c.id === parentId)) {
          return prev.map((c) =>
            c.id === parentId ? { ...c, replies: [newReply, ...(c.replies || [])] } : c
          )
        }
        // If replying to a nested reply, find its top-level parent and insert in its replies
        return prev.map((c) => {
          if (c.replies?.some((r) => r.id === parentId)) {
            return { ...c, replies: [newReply, ...(c.replies || [])] }
          }
          return c
        })
      })

      // Clear reply box
      setReplyText((prev) => ({ ...prev, [parentId]: '' }))
      setReplyOpenFor(null)
    } catch (e) {
      setToastMsg('Failed to post reply')
      setShowToast(true)
    }
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comments</h2>

      {/* Composer */}
      <div className="mb-6">
        {canComment ? (
          <div className="flex items-center gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <Button onClick={submit} disabled={!newComment.trim() || posting}>
              {posting ? 'Posting...' : 'Comment'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <a className="text-indigo-600 hover:underline" href="/sign-in">Sign in</a> to comment.
          </p>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No comments yet. Be the first to comment!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="">
              <div className="flex gap-3">
                {c.user.avatar ? (
                  <Image src={c.user.avatar} alt={c.user.username} width={36} height={36} className="rounded-full w-9 h-9 object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold">
                    {c.user.username[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{c.user.firstName || c.user.lastName ? `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim() : `@${c.user.username}`}</span>
                    <span className="text-gray-500 dark:text-gray-400">@{c.user.username}</span>
                    <span className="text-gray-400">• {formatTime(c.createdAt)}</span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-1">{c.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => setReplyOpenFor(replyOpenFor === c.id ? null : c.id)}
                      className="hover:underline"
                    >
                      Reply
                    </button>
                    {c._count?.replies ? (
                      <span>{c._count.replies} repl{c._count.replies === 1 ? 'y' : 'ies'}</span>
                    ) : null}
                  </div>

                  {replyOpenFor === c.id && canComment && (
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        value={replyText[c.id] || ''}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder={`Reply to @${c.user.username}`}
                        className="flex-1"
                      />
                      <Button onClick={() => submitReply(c.id)} disabled={!((replyText[c.id] || '').trim())}>
                        Reply
                      </Button>
                    </div>
                  )}

                  {c.replies?.length ? (
                    <ul className="mt-3 space-y-3 border-l pl-4 border-gray-200 dark:border-gray-800">
                      {c.replies.map((r) => (
                        <li key={r.id} className="">
                          <div className="flex gap-3">
                            {r.user.avatar ? (
                              <Image src={r.user.avatar} alt={r.user.username} width={30} height={30} className="rounded-full w-7 h-7 object-cover" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold">
                                {r.user.username[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-900 dark:text-white">{r.user.firstName || r.user.lastName ? `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim() : `@${r.user.username}`}</span>
                                <span className="text-gray-500 dark:text-gray-400">@{r.user.username}</span>
                                <span className="text-gray-400">• {formatTime((r as any).createdAt)}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-1">{r.content}</p>
                              <div className="mt-2">
                                <button
                                  onClick={() => setReplyOpenFor(replyOpenFor === r.id ? null : r.id)}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Reply
                                </button>
                                {replyOpenFor === r.id && canComment && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Input
                                      value={replyText[r.id] || ''}
                                      onChange={(e) => setReplyText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                                      placeholder={`Reply to @${r.user.username}`}
                                      className="flex-1"
                                    />
                                    <Button onClick={() => submitReply(r.id)} disabled={!((replyText[r.id] || '').trim())}>
                                      Reply
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Toast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
