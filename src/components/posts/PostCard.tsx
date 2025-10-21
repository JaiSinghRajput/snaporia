"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, Share2, Eye, MoreVertical } from "lucide-react"
import { motion } from "framer-motion"
import CommentsDrawer from "./CommentsDrawer"
import ShareModal from "./ShareModal"
import Image from "next/image"

interface PostCardProps {
  post: {
    id: string
    content: string
    imageUrls: string[]
    videoUrl?: string | null
    createdAt: string
    author: {
      id: string
      username: string
      firstName: string | null
      lastName: string | null
      avatar: string | null
      isVerified: boolean
    }
    _count: {
      likes: number
      comments: number
      shares: number
      views: number
    }
  }
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [likeCount, setLikeCount] = useState<number>(post._count.likes)
  const [shareCount, setShareCount] = useState<number>(post._count.shares)
  const [viewCount, setViewCount] = useState<number>(post._count.views)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [viewTracked, setViewTracked] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const fullName = [post.author.firstName, post.author.lastName]
    .filter(Boolean)
    .join(" ")
  const displayName = fullName || `@${post.author.username}`

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  // Track view when post enters viewport
  useEffect(() => {
    if (!cardRef.current || viewTracked) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewTracked) {
            setViewTracked(true)
            trackView()
          }
        })
      },
      { threshold: 0.5 } // 50% of post must be visible
    )

    observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [viewTracked])

  const trackView = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/view`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setViewCount(data.count)
      }
    } catch (err) {
      console.error('Error tracking view:', err)
    }
  }

  const handleLike = async () => {
    const prevLiked = isLiked
    const prevCount = likeCount
    setIsLiked(!prevLiked)
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1)

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to toggle like')
      const data = await response.json()
      setIsLiked(data.liked)
      setLikeCount(data.count)
    } catch (err) {
      console.error('Error liking post:', err)
      // Revert
      setIsLiked(prevLiked)
      setLikeCount(prevCount)
    }
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const handleShareComplete = async () => {
    const prev = shareCount
    setShareCount(prev + 1)
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, { method: 'POST' })
      if (!res.ok) throw new Error('Share failed')
      const data = await res.json()
      setShareCount(data.count)
    } catch (err) {
      console.error('Error sharing post:', err)
      setShareCount(prev)
    }
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/profile/${post.author.username}`)}
          >
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={displayName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {post.author.username[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </p>
                {post.author.isVerified && (
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.author.username} · {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <MoreVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Video */}
        {post.videoUrl && (
          <div className="mb-3">
            <video
              src={post.videoUrl}
              controls
              className="w-full max-h-[500px] bg-black"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Images */}
        {post.imageUrls.length > 0 && (
          <div
            className={`${
              post.imageUrls.length === 1
                ? "grid grid-cols-1"
                : post.imageUrls.length === 2
                ? "grid grid-cols-2"
                : post.imageUrls.length === 3
                ? "grid grid-cols-2"
                : "grid grid-cols-2"
            } gap-1 mb-3`}
          >
            {post.imageUrls.slice(0, 4).map((url, index) => (
              <div
                key={index}
                className={`relative ${
                  post.imageUrls.length === 3 && index === 0 ? "col-span-2" : ""
                }`}
              >
                <Image
                  src={url}
                  alt={`Post image ${index + 1}`}
                  width={800}
                  height={800}
                  className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition"
                  onClick={() => window.open(url, "_blank")}
                />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                isLiked ? "text-red-500" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`}
              />
              <span className="text-sm font-medium">{likeCount}</span>
            </button>

            <button onClick={() => setCommentsOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post._count.comments}</span>
            </button>

            <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition">
              <Share2 className="w-5 h-5" />
              <span className="text-sm font-medium">{shareCount}</span>
            </button>

          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition">
            <Eye className="w-5 h-5" />
            <span className="text-sm font-medium">{viewCount}</span>
          </button>
          </div>
        </div>
      </motion.div>

      {/* Comments Drawer */}
      <CommentsDrawer postId={post.id} isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} />
      
      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => {
          setShareModalOpen(false)
          handleShareComplete()
        }}
        postId={post.id}
        postUrl={`${window.location.origin}/post/${post.id}`}
      />
    </>
  )
}

// Render the card along with the comments drawer using a fragment
export function PostCardWithDrawerWrapper(props: PostCardProps) {
  return (
    <>
      <PostCard {...props} />
      {/* Comments Drawer moved inside PostCard component state, so this wrapper is optional */}
    </>
  )
}
