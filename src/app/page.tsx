"use client"

import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { PenSquare } from "lucide-react"
import CreatePost from "@/components/posts/CreatePost"
import PostFeed from "@/components/posts/PostFeed"
import LeftSidebar from "@/components/layout/LeftSidebar"
import RightSidebar from "@/components/layout/RightSidebar"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const { user } = useUser()
  const { isLoaded } = useAuth()
  const [showCreatePost, setShowCreatePost] = useState(false)

  return (
    <div className="min-h-screen">
      <SignedOut>
        <section className="min-h-screen flex items-center justify-center">
          <div className="text-center py-16 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl text-white max-w-3xl">
            <h1 className="text-5xl font-extrabold mb-6">Welcome to Snaporia</h1>
            <p className="mb-8 text-xl opacity-90">
              Share your moments, connect with friends, and discover amazing content
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push("/sign-up")}
                className="bg-white text-indigo-700 font-semibold hover:bg-gray-100 px-8 py-6 text-lg rounded-xl"
              >
                Get Started
              </Button>
              <Button
                onClick={() => router.push("/sign-in")}
                className="bg-transparent border-2 border-white text-white font-semibold hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>
      </SignedOut>

      <SignedIn>
        {/* 3-Column Layout */}
        <div className="flex">
          {/* Left Sidebar - Navigation */}
          <LeftSidebar />

          {/* Center Feed */}
          <main className="flex-1 md:ml-20 lg:ml-64 xl:mr-80 min-h-screen border-x border-gray-200 dark:border-gray-800">
            <div className="max-w-2xl mx-auto w-full py-6 px-4">
              {/* Header - Mobile Only */}
              <div className="mb-6 lg:hidden">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {user?.firstName || "there"}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  What&apos;s on your mind today?
                </p>
              </div>

              {/* Create Post Button */}
              <button
                onClick={() => setShowCreatePost(true)}
                className="w-full mb-6 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-3 text-left group"
              >
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.firstName || "User"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user?.firstName?.[0] || "U"}
                  </div>
                )}
                <span className="flex-1 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition">
                  Share your thoughts...
                </span>
                <PenSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>

              {/* Post Feed */}
              {isLoaded && <PostFeed />}
            </div>
          </main>

          {/* Right Sidebar - Trending & Suggestions */}
          <RightSidebar />
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overscroll-contain" style={{ overflowAnchor: 'none' }}>
              <CreatePost
                onClose={() => setShowCreatePost(false)}
                onPostCreated={() => {
                  setShowCreatePost(false)
                  window.location.reload() // Refresh feed
                }}
              />
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  )
}
