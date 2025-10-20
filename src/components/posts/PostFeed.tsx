"use client"

import { useState, useEffect } from "react"
import PostCard from "./PostCard"
import Loader from "../ui/Loader"

interface Post {
  id: string
  content: string
  imageUrls: string[]
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

export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/posts")
      
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error("Error fetching posts:", err)
      setError("Failed to load posts. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts])
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No posts yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Be the first to share something!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
