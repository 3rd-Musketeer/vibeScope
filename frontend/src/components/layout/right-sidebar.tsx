import { QueryInterface } from '@/components/query/query-interface'

export function RightSidebar() {
  return (
    <aside className="w-80 border-l p-4 flex flex-col h-full">
      <QueryInterface />
    </aside>
  )
}