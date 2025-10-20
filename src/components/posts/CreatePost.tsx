"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Image as ImageIcon, Smile, Send, Loader2, Video, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import Toast from "@/components/ui/toast"
import { motion, AnimatePresence } from "framer-motion"
import { useUploadQueue } from "@/components/providers/UploadQueueProvider"
import { Progress } from "@/components/ui/progress"

interface CreatePostProps {
  onClose?: () => void
  onPostCreated?: () => void
}

export default function CreatePost({ onClose, onPostCreated }: CreatePostProps) {
  const router = useRouter()
  const { enqueueVideoPost } = useUploadQueue()
  const [content, setContent] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageInput, setImageInput] = useState("")
  const [videoUrl, setVideoUrl] = useState<string>("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const [compressionProgress, setCompressionProgress] = useState<number>(0)
  const [compressionTime, setCompressionTime] = useState<number>(0)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false })
  const [isCompressing, setIsCompressing] = useState(false)
  const imageFileInputRef = useRef<HTMLInputElement>(null)
  const videoFileInputRef = useRef<HTMLInputElement>(null)

  const handleAddImage = () => {
    if (imageInput.trim() && imageUrls.length < 4) {
      setImageUrls([...imageUrls, imageInput.trim()])
      setImageInput("")
    }
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setIsUploading(true)
    setUploadProgress(type === 'video' ? 'Ready to post in background' : `Uploading ${type}...`)
    setError("")

    try {
      if (type === 'video') {
        // Prepare preview and wait for submit to enqueue background job
        setVideoFile(file)
        const objUrl = URL.createObjectURL(file)
        setVideoUrl(objUrl)
        setToast({ message: 'Video ready to post in background', show: true })
      } else {
        // images still upload inline
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!response.ok) {
          let message = 'Upload failed'
          try { const data = await response.json(); message = data.error || message } catch {}
          throw new Error(message)
        }
        const data = await response.json()
        if (imageUrls.length < 4) {
          setImageUrls([...imageUrls, data.url])
          setToast({ message: 'Image uploaded!', show: true })
        }
      }

      setUploadProgress("")
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload file')
      setToast({ message: err.message || 'Failed to upload file', show: true })
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, 'image')
    }
  }

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, 'video')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
      // Validate that at least content or images/video are provided
      const hasContent = content.trim().length > 0
      const hasImages = imageUrls.length > 0
      const hasVideo = videoUrl.length > 0
    
      if (!hasContent && !hasImages && !hasVideo) {
        setError("Post must have content, images, or a video")
        return
      }

    setIsSubmitting(true)
    setError("")

    try {
      // If a video is selected, enqueue background job and close immediately
      if (videoFile) {
        enqueueVideoPost({
          file: videoFile,
          content,
          imageUrls,
          onDone: (ok) => {
            if (ok) onPostCreated?.(); else setError('Background posting failed')
            router.refresh()
          }
        })
        // Cleanup preview url
        try { if (videoUrl) URL.revokeObjectURL(videoUrl) } catch {}
        // Reset and close composer
        setContent("")
        setImageUrls([])
        setVideoUrl("")
        setVideoFile(null)
        onClose?.()
        return
      }

      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          imageUrls,
          videoUrl: videoUrl || undefined,
        }),
      })

      if (response.ok) {
  setContent("")
  setImageUrls([])
  setVideoUrl("")
  setVideoFile(null)
        if (onPostCreated) {
          onPostCreated()
        }
        if (onClose) {
          onClose()
        }
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      setError("Failed to create post. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Create Post
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          disabled={isSubmitting}
        />

        {/* Image Previews */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {imageUrls.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x300?text=Invalid+Image"
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && (
          <div className="relative group">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-96 rounded-lg bg-black"
            />
            <button
              type="button"
              onClick={() => { try { if (videoUrl) URL.revokeObjectURL(videoUrl) } catch {}; setVideoUrl(""); setVideoFile(null) }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Image URL Input */}
        {imageUrls.length < 4 && !videoUrl && (
          <div className="flex gap-2">
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Add image URL (max 4)"
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting || isUploading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddImage()
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddImage}
              variant="outline"
              disabled={!imageInput.trim() || isSubmitting || isUploading}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Upload/Compression Progress */}
        {(isUploading || isCompressing) && uploadProgress && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}
        {isCompressing && (
          <div className="space-y-1">
            <Progress value={compressionProgress} />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {compressionProgress}% {compressionTime ? `• t=${Math.round(compressionTime)}s` : ''}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            {/* Upload Image Button */}
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
              disabled={isSubmitting || isUploading || imageUrls.length >= 4 || !!videoUrl}
            />
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isUploading || imageUrls.length >= 4 || !!videoUrl}
              title="Upload image"
            >
              <Upload className="w-5 h-5 text-gray-500" />
            </button>

            {/* Upload Video Button */}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoFileChange}
              className="hidden"
              disabled={isSubmitting || isUploading || !!videoUrl || imageUrls.length > 0}
            />
            <button
              type="button"
              onClick={() => videoFileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isUploading || !!videoUrl || imageUrls.length > 0}
              title="Upload video"
            >
              <Video className="w-5 h-5 text-gray-500" />
            </button>

            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              disabled={isSubmitting || isUploading}
            >
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || isUploading || (!content.trim() && imageUrls.length === 0 && !videoUrl)}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </Button>
        </div>
      </form>
    {/* Toast Notification */}
    <Toast
      message={toast.message}
      show={toast.show}
      onClose={() => setToast({ ...toast, show: false })}
      duration={3000}
    />
    </div>
  )
}
