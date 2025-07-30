import { ProjectSelector } from '@/components/project/project-selector'
import { StatsCards } from '@/components/project/stats-cards'

export function Header() {
  return (
    <header className="border-b px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold">产品调研助手</h1>
          <ProjectSelector />
        </div>
        <StatsCards />
      </div>
    </header>
  )
}