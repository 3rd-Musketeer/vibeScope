'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useProjectStats, useExportProject } from '@/hooks/use-projects'
import { useStore } from '@/lib/store'

export function StatsCards() {
  const { currentProjectId } = useStore()
  const { data: stats, isLoading: statsLoading } = useProjectStats(currentProjectId)
  const { mutate: exportProject, isPending: isExporting } = useExportProject()

  const handleExport = () => {
    if (currentProjectId) {
      exportProject(currentProjectId)
    }
  }

  const displayStats = [
    { label: '总数', value: stats?.total_tasks?.toString() || '0' },
    { label: '待运行', value: stats?.pending_tasks?.toString() || '0' },
    { label: '运行中', value: stats?.processing_tasks?.toString() || '0' },
    { label: '失败', value: stats?.failed_tasks?.toString() || '0' },
    { label: '成功', value: stats?.successful_tasks?.toString() || '0' }
  ]

  return (
    <div className="flex items-center space-x-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-8">
            {displayStats.map((stat, index) => (
              <div key={stat.label} className="flex items-center space-x-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                  <div className="text-xl font-semibold">
                    {statsLoading ? '...' : stat.value}
                  </div>
                </div>
                {index < displayStats.length - 1 && (
                  <div className="h-8 w-px bg-border ml-8" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExport}
        disabled={!currentProjectId || isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? '导出中...' : '导出数据'}
      </Button>
    </div>
  )
}