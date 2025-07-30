import { ChatInterface } from '@/components/chat/chat-interface'

export function RightSidebar() {
  return (
    <aside className="flex-1 border-l p-6 overflow-y-auto">
      <ChatInterface />
    </aside>
  )
}