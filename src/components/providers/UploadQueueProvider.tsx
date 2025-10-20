"use client"

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { idbAddJob, idbDeleteJob, idbGetAllJobs } from '@/lib/idb'

type PendingPost = {
  id: string
  kind: 'video'
  previewUrl: string
  content: string
  imageUrls?: string[]
  createdAt: number
}

type VideoPostJob = {
  id: string
  file: File
  content: string
  imageUrls?: string[]
  onDone?: (ok: boolean) => void
  previewUrl?: string
}

type QueueContext = {
  enqueueVideoPost: (params: Omit<VideoPostJob, 'id'>) => void
  pendingPosts: PendingPost[]
}

const UploadQueueCtx = createContext<QueueContext | null>(null)

export function useUploadQueue() {
  const ctx = useContext(UploadQueueCtx)
  if (!ctx) throw new Error('useUploadQueue must be used within UploadQueueProvider')
  return ctx
}

export default function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [subtext, setSubtext] = useState('')
  const workingRef = useRef(false)
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])

  const runVideoPost = useCallback(async (job: VideoPostJob) => {
    try {
      workingRef.current = true
      setVisible(true)
      setMessage('Compressing video…')
      setSubtext('')
      setProgress(0)

      // Start compression worker
      const worker = new Worker('/videoCompressor.worker.js')
      const compressedFile: File = await new Promise((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          const data = e.data as { progress?: number; time?: number; error?: string; compressed?: Uint8Array }
          if (typeof data?.progress === 'number') {
            setProgress(Math.round(data.progress * 100))
            if (typeof data.time === 'number') setSubtext(`t=${Math.round(data.time)}s`)
            return
          }
          if (data?.error) {
            reject(new Error(data.error))
            worker.terminate()
            return
          }
          // got compressed buffer - create proper File object
          if (!data.compressed) {
            reject(new Error('No compressed data received from worker'))
            worker.terminate()
            return
          }
          const blob = new Blob([new Uint8Array(data.compressed)], { type: 'video/mp4' })
          const file = new File([blob], 'video.mp4', { 
            type: 'video/mp4',
            lastModified: Date.now()
          })
          console.log('Created file:', file.name, file.type, file.size, 'bytes')
          resolve(file)
          worker.terminate()
        }
        worker.onerror = (err: ErrorEvent) => {
          reject(new Error(err.message || 'Compression failed'))
          worker.terminate()
        }
        worker.postMessage({ file: job.file, quality: '1M' })
      })

      setMessage('Uploading video…')
      setSubtext('')
      // Upload to S3 via API
      const form = new FormData()
      form.append('file', compressedFile)
      
      console.log('FormData created, file:', compressedFile.name, compressedFile.type, compressedFile.size)
      console.log('FormData entries:', Array.from(form.entries()).map(([k,v]) => [k, v instanceof File ? `File(${v.name})` : v]))
      
      // Don't set Content-Type header manually - let browser set it with boundary
      const upRes = await fetch('/api/upload', { 
        method: 'POST', 
        body: form,
        // Explicitly omit headers to let fetch auto-set multipart/form-data with boundary
      })
      console.log('Upload response status:', upRes.status, upRes.statusText)
      if (!upRes.ok) {
        let errMsg = 'Upload failed'
        try { const data = await upRes.json(); errMsg = data.error || errMsg } catch {}
        throw new Error(errMsg)
      }
      const { url } = await upRes.json()

      setMessage('Posting…')
      // Create post
      const postRes = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: job.content.trim(), imageUrls: job.imageUrls || [], videoUrl: url })
      })
      if (!postRes.ok) {
        let errMsg = 'Failed to create post'
        try { const data = await postRes.json(); errMsg = data.error || errMsg } catch {}
        throw new Error(errMsg)
      }

      setMessage('Posted!')
      setProgress(100)
      setSubtext('')
      job.onDone?.(true)
      // Hide after a moment
      setTimeout(() => { setVisible(false); setProgress(0); setMessage(''); workingRef.current = false }, 1200)
    } catch (e) {
      const error = e as Error
      job.onDone?.(false)
      setMessage(error?.message || 'Background post failed')
      setSubtext('')
      setProgress(0)
      // Keep bar visible briefly then hide
      setTimeout(() => { setVisible(false); setMessage(''); workingRef.current = false }, 2500)
    } finally {
      // Remove pending placeholder and revoke URL if any
      if (job.previewUrl) {
        try { URL.revokeObjectURL(job.previewUrl) } catch {}
      }
      setPendingPosts(prev => prev.filter(p => p.id !== job.id))
      // Remove from IDB
      try { await idbDeleteJob(job.id) } catch {}
    }
  }, [])

  const enqueueVideoPost = useCallback(async (params: Omit<VideoPostJob, 'id'>) => {
    if (workingRef.current) return // simple: one job at a time
    const id = crypto.randomUUID()
    // Create a preview object URL for immediate UI listing
    const previewUrl = URL.createObjectURL(params.file)
    // Add to pending list
    setPendingPosts(prev => [
      { id, kind: 'video', previewUrl, content: params.content, imageUrls: params.imageUrls, createdAt: Date.now() },
      ...prev,
    ])
    const job: VideoPostJob = { id, previewUrl, ...params }
    // Persist to IDB (store original file Blob and metadata)
    try { await idbAddJob({ id, kind: 'video', content: params.content, imageUrls: params.imageUrls, createdAt: Date.now(), blob: params.file }) } catch {}
    runVideoPost(job)
  }, [runVideoPost])

  const value = useMemo<QueueContext>(() => ({ enqueueVideoPost, pendingPosts }), [enqueueVideoPost, pendingPosts])

  // Restore pending jobs after refresh
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const records = await idbGetAllJobs()
        if (cancelled) return
        if (!records.length) return
        // Add to pending UI first
        setPendingPosts(prev => {
          const existing = new Set(prev.map(p => p.id))
          const additions: PendingPost[] = []
          for (const r of records) {
            if (!existing.has(r.id)) {
              const previewUrl = URL.createObjectURL(r.blob)
              additions.push({ id: r.id, kind: 'video', previewUrl, content: r.content, imageUrls: r.imageUrls, createdAt: r.createdAt })
            }
          }
          return [...additions, ...prev]
        })
        // Start processing the first one if not already working
        if (!workingRef.current) {
          const r = records.sort((a,b)=>a.createdAt-b.createdAt)[0]
          const file = new File([r.blob], 'restore.mp4', { type: r.blob.type || 'video/mp4' })
          const previewUrl = undefined // already created above; job will revoke at end
          runVideoPost({ id: r.id, file, content: r.content, imageUrls: r.imageUrls, onDone: undefined, previewUrl })
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [runVideoPost])

  return (
    <UploadQueueCtx.Provider value={value}>
      {children}
      {visible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(640px,90vw)] rounded-lg bg-gray-900 text-white shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{message}</span>
            {subtext && <span className="text-xs text-gray-300">{subtext}</span>}
          </div>
          <Progress value={progress} />
        </div>
      )}
    </UploadQueueCtx.Provider>
  )
}
