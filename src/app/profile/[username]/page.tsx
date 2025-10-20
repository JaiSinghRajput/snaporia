import { notFound } from "next/navigation"
import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { 
  getUserProfileByUsername, 
  getCurrentUserProfile, 
  getFollowStatus,
  isFollowedBy 
} from "@/lib/user"
import { getUserPosts } from "@/lib/posts"
import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfilePostsGridClient from "@/components/profile/ProfilePostsGridClient"

interface ProfilePageProps {
  params: {
    username: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = params

  try {
    const profile = await getUserProfileByUsername(username)

    if (!profile) {
      return {
        title: "User Not Found - Snaporia",
      }
    }

    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    const displayName = fullName || `@${profile.username}`

    return {
      title: `${displayName} (@${profile.username}) - Snaporia`,
      description:
        profile.bio || `Check out ${displayName}'s profile on Snaporia`,
      openGraph: {
        title: `${displayName} on Snaporia`,
        description: profile.bio || `Follow ${displayName} on Snaporia`,
        images: profile.avatar ? [profile.avatar] : [],
      },
      twitter: {
        card: "summary",
        title: `${displayName} on Snaporia`,
        description: profile.bio || `Follow ${displayName} on Snaporia`,
        images: profile.avatar ? [profile.avatar] : [],
      },
    }
  } catch (error) {
    return {
      title: "Profile - Snaporia",
    }
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params

  // Get the profile
  const profile = await getUserProfileByUsername(username)

  if (!profile) {
    notFound()
  }

  // Get current user to check if viewing own profile
  const { userId } = await auth()
  let currentUserProfile = null
  let isOwnProfile = false
  let followStatus: 'PENDING' | 'ACCEPTED' | null = null
  let isFollowingYou = false

  if (userId) {
    currentUserProfile = await getCurrentUserProfile()
    isOwnProfile = currentUserProfile?.id === profile.id
    
    // Check follow status and if they're following you back
    if (currentUserProfile && !isOwnProfile) {
      followStatus = await getFollowStatus(currentUserProfile.id, profile.id)
      isFollowingYou = await isFollowedBy(currentUserProfile.id, profile.id)
    }
  }

  // Get user's posts
  const posts = await getUserPosts(profile.id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ProfileHeader
        profile={profile}
        followStatus={followStatus}
        isFollowingYou={isFollowingYou}
        isOwnProfile={isOwnProfile}
      />

  {/* Posts Section */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
          <nav className="flex gap-8">
            <button className="pb-4 border-b-2 border-indigo-600 font-semibold text-gray-900 dark:text-white">
              Posts
            </button>
            <button className="pb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Media
            </button>
            <button className="pb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Likes
            </button>
          </nav>
        </div>

  {/* Pending (client) */}
  {isOwnProfile && <ProfilePostsGridClient />}

  {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post: {
                id: string
                content: string
                imageUrls: string[]
                _count: { likes: number; comments: number; views: number }
              }) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
              >
                {post.imageUrls.length > 0 && (
                  <div className="h-48 bg-gray-200 dark:bg-gray-800">
                    <img
                      src={post.imageUrls[0]}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-gray-800 dark:text-gray-200 line-clamp-3">
                    {post.content}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>❤️ {post._count.likes}</span>
                    <span>💬 {post._count.comments}</span>
                    <span>👁️ {post._count.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
