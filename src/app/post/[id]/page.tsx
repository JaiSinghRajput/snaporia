import { notFound } from 'next/navigation'
import PostCard from '@/components/posts/PostCard'
import ClientComments from './ClientComments'
import { getPostById } from '@/lib/posts'
import { auth } from '@clerk/nextjs/server'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params
  const { userId } = await auth()

  const post = await getPostById(id, userId ?? undefined)
  if (!post) return notFound()

  const postForCard = {
    id: post.id,
    content: post.content,
    imageUrls: post.imageUrls,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    _count: post._count,
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-6 px-4">
      <PostCard post={postForCard} />
  {/** Load comments strictly on the client to avoid any SSR boundary issues */}
  <ClientComments postId={id} />
    </div>
  )
}
