import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getPostById } from '@/lib/posts'
import { getCurrentUserProfile } from '@/lib/user'
import EditPostForm from '@/components/posts/EditPostForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const post = await getPostById(id, userId ?? undefined)
  if (!post) return notFound()

  // Only author can edit: check DB profile id
  const me = await getCurrentUserProfile()
  if (!me || me.id !== post.author.id) {
    return notFound()
  }

  // Render form with initial values
  return (
    <EditPostForm
      postId={post.id}
      initialContent={post.content}
      initialVisibility={post.visibility as 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS_ONLY'}
    />
  )
}
