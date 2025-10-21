import { Suspense } from "react"
import { SignedIn } from "@clerk/nextjs"
import ChatList from "@/components/chat/ChatList"
import { MessageCircle, Loader2 } from "lucide-react"

export default function MessagesPage() {
  return (
    <SignedIn>
      <div className="w-full h-[100dvh] flex flex-col sm:flex-row bg-white dark:bg-gray-900">
        {/* Left: Chat List (always visible) */}
        <div className="w-full sm:w-[340px] h-[100dvh] flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 sm:px-6 py-3 sm:py-5 flex items-center gap-2 sm:gap-3 shadow-lg sticky top-16 z-40 min-h-[56px] sm:min-h-[64px]">
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Messages</h1>
              <p className="text-xs sm:text-sm text-white/80 mt-0.5 truncate">Stay connected with your friends</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-2 sm:pb-4">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
                <div className="text-center">
                  <Loader2 className="w-7 h-7 sm:w-10 sm:h-10 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Loading conversations...</p>
                </div>
              </div>
            }>
              <ChatList />
            </Suspense>
          </div>
        </div>
        {/* Middle: Spacer or future features (hidden for now) */}
        <div className="hidden sm:block flex-shrink-0 w-[1px] bg-gray-100 dark:bg-gray-800" />
        {/* Right: Chat window (desktop only, resizable) */}
        <div className="hidden sm:flex flex-1 h-[100dvh] min-w-0 relative">
          {/* Placeholder: Select a chat to start messaging */}
          <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg">
            Select a conversation to start chatting
          </div>
          {/* In the [id]/page.tsx, the chat window will be shown here via route */}
        </div>
      </div>
    </SignedIn>
  )
}
