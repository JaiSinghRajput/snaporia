"use client"

import React from 'react'
import { useUploadQueue } from '@/components/providers/UploadQueueProvider'

export default function ProfilePostsGridClient() {
  const { pendingPosts } = useUploadQueue()

  if (!pendingPosts.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {pendingPosts.map(p => (
        <div key={p.id} className="relative bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200 dark:bg-gray-800">
            <video src={p.previewUrl} className="w-full h-full object-cover" muted autoPlay loop />
          </div>
          <div className="p-4">
            <p className="text-gray-800 dark:text-gray-200 line-clamp-3">{p.content}</p>
          </div>
          <span className="absolute top-2 left-2 text-xs font-semibold bg-amber-500 text-white px-2 py-1 rounded">
            Pending
          </span>
        </div>
      ))}
    </div>
  )
}
