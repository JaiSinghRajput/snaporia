"use client"

import { useState, useEffect, useCallback } from "react"
import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs"
import { Search, TrendingUp, Users, Hash, Loader2, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import LeftSidebar from "@/components/layout/LeftSidebar"
import RightSidebar from "@/components/layout/RightSidebar"
import PostCard from "@/components/posts/PostCard"
import UserCard from "@/components/explore/UserCard"
import HashtagCard from "@/components/explore/HashtagCard"
import { Button } from "@/components/ui/button"

type TabType = "posts" | "users" | "hashtags"

interface Post {
  id: string
  [key: string]: unknown
}

interface User {
  id: string
  [key: string]: unknown
}

interface Hashtag {
  id: string
  [key: string]: unknown
}

export default function ExplorePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded } = useAuth()
  
  const [activeTab, setActiveTab] = useState<TabType>("posts")
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "")
  const [isSearching, setIsSearching] = useState(false)
  
  // Data states
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([])
  
  // Search results
  const [searchResults, setSearchResults] = useState<{
    posts?: Post[]
    users?: User[]
    hashtags?: Hashtag[]
  }>({})
  
  const [loading, setLoading] = useState(true)

  // Fetch trending data on mount
  useEffect(() => {
    if (!isLoaded) return
    
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const [postsRes, usersRes, hashtagsRes] = await Promise.all([
          fetch('/api/explore/trending-posts').catch(() => null),
          fetch('/api/explore/suggested-users?limit=10').catch(() => null),
          fetch('/api/explore/trending').catch(() => null),
        ])

        if (postsRes?.ok) {
          try {
            const text = await postsRes.text()
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const data = JSON.parse(text)
              console.log('✅ Trending posts loaded:', data.posts?.length || 0)
              setTrendingPosts(data.posts || [])
            }
          } catch (err) {
            console.error('Error parsing trending posts:', err)
          }
        } else {
          console.error('Failed to fetch trending posts:', postsRes?.status)
        }

        if (usersRes?.ok) {
          try {
            const text = await usersRes.text()
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const data = JSON.parse(text)
              console.log('✅ Suggested users loaded:', data.users?.length || 0)
              setSuggestedUsers(data.users || [])
            }
          } catch (err) {
            console.error('Error parsing suggested users:', err)
          }
        } else {
          console.error('Failed to fetch suggested users:', usersRes?.status)
        }

        if (hashtagsRes?.ok) {
          try {
            const text = await hashtagsRes.text()
            if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
              const data = JSON.parse(text)
              console.log('✅ Trending hashtags loaded:', data.hashtags?.length || 0)
              setTrendingHashtags(data.hashtags || [])
            }
          } catch (err) {
            console.error('Error parsing trending hashtags:', err)
          }
        } else {
          console.error('Failed to fetch trending hashtags:', hashtagsRes?.status)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [isLoaded])

  // Handle search
  const handleSearch = useCallback(async (query: string, type: TabType = 'posts') => {
    if (!query.trim()) {
      setSearchResults({})
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/explore/search?q=${encodeURIComponent(query)}&type=${type}`)
      if (res.ok) {
        try {
          const text = await res.text()
          if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            const data = JSON.parse(text)
            setSearchResults(data)
          } else {
            console.error('Invalid JSON response from search')
            setSearchResults({})
          }
        } catch (err) {
          console.error('Error parsing search results:', err)
          setSearchResults({})
        }
      } else {
        console.error('Search request failed:', res.status, res.statusText)
        setSearchResults({})
      }
    } catch (error) {
      console.error('Error searching:', error)
      setSearchResults({})
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery, activeTab)
      } else {
        setSearchResults({})
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, activeTab, handleSearch])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (activeTab !== 'posts') params.set('type', activeTab)
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/explore'
    window.history.replaceState(null, '', newUrl)
  }, [searchQuery, activeTab])

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults({})
  }

  const isSearchActive = searchQuery.trim().length > 0
  const currentPosts = isSearchActive ? (searchResults.posts || []) : trendingPosts
  const currentUsers = isSearchActive ? (searchResults.users || []) : suggestedUsers
  const currentHashtags = isSearchActive ? (searchResults.hashtags || []) : trendingHashtags

  // Debug logging
  useEffect(() => {
    console.log('🔍 Explore state:', {
      isSearchActive,
      activeTab,
      currentPostsCount: currentPosts.length,
      currentUsersCount: currentUsers.length,
      currentHashtagsCount: currentHashtags.length,
      loading
    })
  }, [isSearchActive, activeTab, currentPosts.length, currentUsers.length, currentHashtags.length, loading])

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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, users, hashtags..."
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={20} />
                    </button>
                  )}
                  {isSearching && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    </div>
                  )}
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
                  onClick={() => setActiveTab("hashtags")}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === "hashtags"
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  <Hash className="w-5 h-5" />
                  <span>Hashtags</span>
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              )}

              {/* Content */}
              {!loading && (
                <>
                  {/* Posts Tab */}
                  {activeTab === "posts" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isSearchActive ? 'Search Results' : 'Trending Posts'}
                      </h2>
                      {currentPosts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          {isSearchActive ? 'No posts found' : 'No trending posts yet'}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {currentPosts.map((post) => (
                            <PostCard key={post.id} post={post as Parameters<typeof PostCard>[0]['post']} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Users Tab */}
                  {activeTab === "users" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isSearchActive ? 'Search Results' : 'Suggested Users'}
                      </h2>
                      {currentUsers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          {isSearchActive ? 'No users found' : 'No suggested users'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentUsers.map((user) => (
                            <UserCard key={user.id} user={user as unknown as Parameters<typeof UserCard>[0]['user']} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hashtags Tab */}
                  {activeTab === "hashtags" && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isSearchActive ? 'Search Results' : 'Trending Hashtags'}
                      </h2>
                      {currentHashtags.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          {isSearchActive ? 'No hashtags found' : 'No trending hashtags yet'}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentHashtags.map((hashtag, index: number) => (
                            <HashtagCard 
                              key={hashtag.id} 
                              hashtag={hashtag as unknown as Parameters<typeof HashtagCard>[0]['hashtag']}
                              rank={!isSearchActive ? index + 1 : undefined}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <RightSidebar />
        </div>
      </SignedIn>
    </div>
  )
}
