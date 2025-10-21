import { Suspense } from "react"
import ChatWindow from "@/components/chat/ChatWindow"
import ChatList from "@/components/chat/ChatList"
import { Loader2, MessageCircle } from "lucide-react"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return (
    <div className="w-full h-[100dvh] flex flex-col sm:flex-row bg-white dark:bg-gray-900">
      {/* Left: Chat List (desktop only) */}
      <div className="hidden sm:flex w-[340px] h-[100dvh] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-5 flex items-center gap-3 shadow-lg sticky top-16 z-40 min-h-[64px]">
          <MessageCircle className="w-7 h-7 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <h1 className="text-2xl font-bold truncate">Messages</h1>
            <p className="text-sm text-white/80 mt-0.5 truncate">Stay connected with your friends</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</p>
              </div>
            </div>
          }>
            <ChatList />
          </Suspense>
        </div>
      </div>
      {/* Middle: Resizable divider */}
      <div className="hidden sm:block flex-shrink-0 w-[4px] cursor-col-resize bg-gray-100 dark:bg-gray-800" style={{ resize: 'horizontal', minWidth: 4, maxWidth: 12 }} />
      {/* Right: Chat window */}
      <div className="flex-1 h-[100dvh] min-w-0 relative">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-[#E5DDD5]">
            <Loader2 className="w-8 h-8 animate-spin text-[#075E54]" />
          </div>
        }>
          <ChatWindow conversationId={resolvedParams.id} />
        </Suspense>
      </div>
    </div>
  )
}
