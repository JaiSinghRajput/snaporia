"use client"

import { useState } from "react"
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs"
import { Search, TrendingUp, Users, Hash } from "lucide-react"
import { useRouter } from "next/navigation"
import LeftSidebar from "@/components/layout/LeftSidebar"
import RightSidebar from "@/components/layout/RightSidebar"
import PostFeed from "@/components/posts/PostFeed"
import { Button } from "@/components/ui/button"

export default function ExplorePage() {
  const router = useRouter()
  const { isLoaded } = useAuth()
  const [activeTab, setActiveTab] = useState<"posts" | "users" | "tags">("posts")

  return (
    <div className="min-h-screen">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold mb-4">Sign in to explore</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Discover amazing content and connect with people
            </p>
            <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex">
          <LeftSidebar />

          <main className="flex-1 md:ml-20 lg:ml-64 xl:mr-80 min-h-screen border-x border-gray-200 dark:border-gray-800">
            <div className="max-w-2xl mx-auto w-full py-6 px-4">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Explore
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover trending posts and popular users
                </p>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts, users, hashtags..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === "posts"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Posts</span>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === "users"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab("tags")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === "tags"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Hash className="w-5 h-5" />
                  <span>Tags</span>
                </button>
              </div>

              {/* Content */}
              {activeTab === "posts" && isLoaded && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Trending Posts
                  </h2>
                  <PostFeed />
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Suggested Users
                  </h2>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    User discovery coming soon...
                  </div>
                </div>
              )}

              {activeTab === "tags" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Trending Hashtags
                  </h2>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Hashtag discovery coming soon...
                  </div>
                </div>
              )}
            </div>
          </main>

          <RightSidebar />
        </div>
      </SignedIn>
    </div>
  )
}
