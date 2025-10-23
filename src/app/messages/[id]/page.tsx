import { MessageCircle, ArrowLeft, MoreVertical, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import ConversationListClient from "@/components/chat/ConversationListClient"
import ChatWindowShell from "@/components/chat/ChatWindowShell"
import ChatRefreshButton from "@/components/chat/ChatRefreshButton"
import { getCurrentUserProfile } from "@/lib/user"
import prisma from "@/lib/prisma"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const currentUser = await getCurrentUserProfile()
  
  if (!currentUser) {
    return notFound()
  }

  // Fetch conversation and verify user is a participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: resolvedParams.id,
      participants: {
        some: {
          userId: currentUser.id
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      }
    }
  })

  if (!conversation) {
    return notFound()
  }

  // Get the other user in this conversation
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUser.id)
  const otherUser = otherParticipant?.user ? {
    id: otherParticipant.user.id,
    username: otherParticipant.user.username,
    firstName: otherParticipant.user.firstName ?? '',
    lastName: otherParticipant.user.lastName ?? '',
    avatar: otherParticipant.user.avatar
  } : undefined

  return (
    <div className="w-full h-[calc(100dvh-4rem)] flex flex-col sm:flex-row bg-white dark:bg-gray-900">
      {/* Left: Conversations List (desktop only) */}
      <div className="hidden sm:flex w-[380px] h-full flex-col border-r border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4 flex items-center gap-3">
          <MessageCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-xl font-bold">Messages</h1>
            <p className="text-sm text-white/80">Stay connected</p>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden">
          <ConversationListClient currentUserId={currentUser.id} />
        </div>
      </div>

  {/* Right: Chat Window */}
  <div className="flex-1 flex flex-col h-full">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
          <Link 
            href="/messages"
            className="sm:hidden p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <Link 
            href={otherUser ? `/profile/${otherUser.username}` : '#'}
            className="flex items-center gap-3 flex-1 min-w-0 hover:bg-white/10 rounded-lg px-2 py-1 -ml-2 transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
              {otherUser?.avatar ? (
                <Image
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                  {otherUser?.firstName?.[0] || <User className="w-5 h-5" />}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">
                {otherUser 
                  ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || otherUser.username
                  : 'User'}
              </h2>
              <p className="text-xs text-white/70 truncate">
                @{otherUser?.username || 'unknown'}
              </p>
            </div>
          </Link>

          <ChatRefreshButton conversationId={resolvedParams.id} />
          
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <ChatWindowShell
          conversationId={resolvedParams.id}
          currentUserId={currentUser.id}
          currentUser={{
            id: currentUser.id,
            username: currentUser.username,
            firstName: currentUser.firstName ?? '',
            lastName: currentUser.lastName ?? '',
            avatar: currentUser.avatar
          }}
          otherUser={otherUser}
        />
      </div>
    </div>
  )
}
