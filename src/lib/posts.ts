import { prisma } from '@/lib/prisma'
// Fallback: define minimal PostUpdateInput to avoid type import issues when TS cache is stale
type PostUpdateInput = {
  content?: string
  imageUrls?: string[]
  videoUrl?: string | null
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY'
  isPublished?: boolean
}

/**
 * Create a new post
 */
export async function createPost(data: {
  content: string
  authorId: string
  imageUrls?: string[]
  videoUrl?: string
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY'
}) {
  return await prisma.post.create({
    data: {
      ...data,
      publishedAt: new Date(),
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
        },
      },
    },
  })
}

/**
 * Get post by ID with all related data
 */
export async function getPostById(postId: string, userId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
        },
      },
      hashtags: {
        include: {
          hashtag: true,
        },
      },
    },
  })

  return post
}

/**
 * Get feed posts (paginated)
 */
export async function getFeedPosts(params: {
  userId?: string
  cursor?: string
  limit?: number
}) {
  const { userId, cursor, limit = 10 } = params

  const posts = await prisma.post.findMany({
    take: limit + 1, // Get one extra to determine if there are more
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    where: {
      isPublished: true,
      visibility: 'PUBLIC',
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
        },
      },
    },
  })

  let nextCursor: string | undefined = undefined
  if (posts.length > limit) {
    const nextItem = posts.pop()
    nextCursor = nextItem!.id
  }

  return {
    posts,
    nextCursor,
  }
}

/**
 * Get user's posts
 */
export async function getUserPosts(authorId: string, limit = 20) {
  return await prisma.post.findMany({
    where: {
      authorId,
      isPublished: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
          views: true,
        },
      },
    },
  })
}

/**
 * Update a post
 */
export async function updatePost(postId: string, data: PostUpdateInput) {
  return await prisma.post.update({
    where: { id: postId },
    data,
  })
}

/**
 * Delete a post
 */
export async function deletePost(postId: string) {
  return await prisma.post.delete({
    where: { id: postId },
  })
}

/**
 * Like a post
 */
export async function likePost(userId: string, postId: string) {
  return await prisma.like.create({
    data: {
      userId,
      postId,
    },
  })
}

/**
 * Unlike a post
 */
export async function unlikePost(userId: string, postId: string) {
  return await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  })
}

/**
 * Add a comment to a post
 */
export async function addComment(data: {
  content: string
  userId: string
  postId: string
  parentId?: string
}) {
  return await prisma.comment.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  })
}

/**
 * Get post comments
 */
export async function getPostComments(postId: string) {
  return await prisma.comment.findMany({
    where: {
      postId,
      parentId: null, // Only top-level comments
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  })
}

/**
 * Track a post view
 */
export async function trackPostView(postId: string, userId?: string) {
  return await prisma.view.create({
    data: {
      postId,
      userId,
    },
  })
}

/**
 * Share a post
 */
export async function sharePost(userId: string, postId: string) {
  return await prisma.share.create({
    data: {
      userId,
      postId,
    },
  })
}
