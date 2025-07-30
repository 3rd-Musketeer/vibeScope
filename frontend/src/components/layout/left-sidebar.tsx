import { ChartsSidebar } from '@/components/charts/charts-sidebar'
import { BarChart3 } from 'lucide-react'

export function LeftSidebar() {
  return (
    <aside className="flex-1 border-r p-6 overflow-y-auto">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5" />
        <h2 className="font-semibold">统计图表</h2>
      </div>
      <ChartsSidebar />
    </aside>
  )
}