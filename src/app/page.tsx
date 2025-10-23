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
        <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Join thousands of users worldwide
                  </span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  Share Your Story
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Connect with friends, share moments, and discover amazing content from around the world. 
                  Your social experience, reimagined.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button
                    onClick={() => router.push("/sign-up")}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Get Started Free
                  </Button>
                  <Button
                    onClick={() => router.push("/sign-in")}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    Sign In
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">10K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">50K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Posts Shared</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">100K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Features */}
              <div className="grid gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share Moments</h3>
                  <p className="text-gray-600 dark:text-gray-400">Upload photos, videos, and share your daily experiences with friends and followers.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Real-time Chat</h3>
                  <p className="text-gray-600 dark:text-gray-400">Connect instantly with friends through our powerful messaging system.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Discover Trends</h3>
                  <p className="text-gray-600 dark:text-gray-400">Explore trending topics, hashtags, and discover new content you&apos;ll love.</p>
                </div>
              </div>
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
          <main className="flex-1 md:ml-20 lg:ml-64 xl:ml-72 xl:mr-80 min-h-screen border-x border-gray-200 dark:border-gray-800">
            {/* Feed Header */}
            <div className="sticky top-16 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Home Feed
                </h2>
                <button
                  onClick={() => window.location.reload()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                  title="Refresh feed"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-w-2xl mx-auto w-full py-6 px-4">
              {/* Welcome Message - Mobile Only */}
              <div className="mb-6 lg:hidden p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Welcome back, {user?.firstName || "there"}! 👋
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Share your thoughts and stay connected with friends
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
