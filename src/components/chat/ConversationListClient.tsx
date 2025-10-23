"use client"

import ConversationList from "./ConversationList"

export default function ConversationListClient({ currentUserId }: { currentUserId?: string }) {
  return <ConversationList currentUserId={currentUserId} />
}
