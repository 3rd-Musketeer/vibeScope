import { QueryInterface } from '@/components/query/query-interface'

export function RightSidebar() {
  return (
    <aside className="flex-1 border-l p-4 overflow-y-auto">
      <QueryInterface />
    </aside>
  )
}