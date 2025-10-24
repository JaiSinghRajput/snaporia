import { SignedIn } from "@clerk/nextjs"
import { MessageCircle } from "lucide-react"
import ConversationListClient from "@/components/chat/ConversationListClient"
import PusherStatus from "@/components/chat/PusherStatus"
import MobileNotificationFAB from "@/components/layout/MobileNotificationFAB"
import { getCurrentUserProfile } from "@/lib/user"
import { redirect } from "next/navigation"

export default async function MessagesPage() {
  const currentUser = await getCurrentUserProfile()

  if (!currentUser) {
    redirect('/sign-in')
  }

  return (
    <SignedIn>
      <PusherStatus />
      <MobileNotificationFAB />
      <div className="w-full h-[calc(100dvh-4rem)] flex flex-col sm:flex-row bg-white dark:bg-gray-900">
        {/* Left: Conversations List */}
        <div className="w-full sm:w-[380px] h-full flex flex-col border-r border-gray-200 dark:border-gray-800">
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

        {/* Right: Empty State (desktop only) */}
        <div className="hidden sm:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose a conversation from the list to start chatting
            </p>
          </div>
        </div>
      </div>
    </SignedIn>
  )
}
