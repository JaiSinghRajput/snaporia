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
  const created = await prisma.post.create({
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

  // Extract and sync hashtags for this post
  const tags = extractHashtags(data.content || '')
  if (tags.length) {
    await syncPostHashtags(created.id, tags)
  }

  return created
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
  const updated = await prisma.post.update({
    where: { id: postId },
    data,
  })

  // If content changed, resync hashtags
  if (typeof data.content === 'string') {
    const tags = extractHashtags(data.content)
    await syncPostHashtags(postId, tags)
  }

  return updated
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

// =============================
// Hashtag helpers
// =============================

export function extractHashtags(content: string): string[] {
  const set = new Set<string>()
  if (!content) return []
  const re = /#([A-Za-z0-9_]+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    const tag = match[1].toLowerCase()
    if (tag) set.add(tag)
  }
  return Array.from(set)
}

export async function syncPostHashtags(postId: string, newTags: string[]) {
  const normalized = Array.from(new Set(newTags.map((t) => t.toLowerCase())));

  // Current relations with hashtag ids and names
  const current = await prisma.hashtagOnPost.findMany({
    where: { postId },
    include: { hashtag: { select: { id: true, name: true } } },
  })

  const currentNames = new Set(current.map((hp) => hp.hashtag.name))
  const toAdd = normalized.filter((n) => !currentNames.has(n))
  const toRemove = current.filter((hp) => !normalized.includes(hp.hashtag.name))

  await prisma.$transaction(async (tx) => {
    // Additions: upsert hashtag and create relation; increment counts
    for (const name of toAdd) {
      const tag = await tx.hashtag.upsert({
        where: { name },
        update: { count: { increment: 1 } },
        create: { name, count: 1 },
      })
      await tx.hashtagOnPost.create({
        data: {
          postId,
          hashtagId: tag.id,
        },
      })
    }

    // Removals: delete relation and decrement counts
    for (const hp of toRemove) {
      await tx.hashtagOnPost.delete({ where: { id: hp.id } })
      await tx.hashtag.update({
        where: { id: hp.hashtag.id },
        data: { count: { decrement: 1 } },
      })
    }
  })
}
