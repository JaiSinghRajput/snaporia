"use client"

import PostComments from '@/components/posts/PostComments'

export default function ClientComments({ postId }: { postId: string }) {
  return <PostComments postId={postId} />
}
