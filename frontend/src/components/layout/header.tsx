'use client'

import { ProjectSelector } from '@/components/project/project-selector'
import { TokenDisplay } from '@/components/project/token-display'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Kanban, FileText, Brain, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  activeTab?: string
  onTabChange?: (value: string) => void
}

export function Header({ activeTab = 'notes', onTabChange }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    // 清除认证token
    localStorage.removeItem('system_auth_token')
    // 跳转到登录页面
    router.push('/login')
  }

  return (
    <header className="flex-shrink-0 border-b px-6 py-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">vibeScope</h1>
          <ProjectSelector />
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="w-fit">
              <TabsTrigger 
                value="notes" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm">笔记视图</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm">智能分析</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 px-4 py-2"
              >
                <Kanban className="w-4 h-4" />
                <span className="text-sm">任务管理</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center gap-4">
          <TokenDisplay />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>退出</span>
          </Button>
        </div>
      </div>
    </header>
  )
}