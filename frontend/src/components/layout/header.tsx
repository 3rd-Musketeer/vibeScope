'use client'

import { ProjectSelector } from '@/components/project/project-selector'
import { TokenDisplay } from '@/components/project/token-display'

export function Header() {
  return (
    <header className="border-b px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold">产品调研助手</h1>
          <ProjectSelector />
        </div>
        <div className="flex items-center space-x-4">
          <TokenDisplay />
        </div>
      </div>
    </header>
  )
}