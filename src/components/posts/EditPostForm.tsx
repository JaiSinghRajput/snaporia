"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Toast from '@/components/ui/toast'

type Visibility = 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY'

export default function EditPostForm({
  postId,
  initialContent,
  initialVisibility,
}: {
  postId: string
  initialContent: string
  initialVisibility: Visibility
}) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const [saving, setSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const save = async () => {
    if (!content.trim()) {
      setToastMsg('Content cannot be empty')
      setShowToast(true)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), visibility }),
      })
      if (res.status === 401) {
        setToastMsg('Please sign in')
        setShowToast(true)
        return
      }
      if (res.status === 403) {
        setToastMsg('You are not allowed to edit this post')
        setShowToast(true)
        return
      }
      if (!res.ok) throw new Error('Failed to update')
      setToastMsg('Post updated')
      setShowToast(true)
      // Redirect back to the post page after a short delay
      setTimeout(() => router.push(`/post/${postId}`), 500)
    } catch (e) {
      setToastMsg('Failed to update post')
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-6 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Edit post</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            className="w-full min-h-40 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's new?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Visibility</label>
          <select
            className="w-full h-10 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
          >
            <option value="PUBLIC">Public</option>
            <option value="FOLLOWERS_ONLY">Followers only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>Save</Button>
          <Button variant="outline" onClick={() => router.push(`/post/${postId}`)} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>

      <Toast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />
    </div>
  )
}
