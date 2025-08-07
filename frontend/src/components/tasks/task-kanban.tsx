'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTasks } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { TaskCard } from './task-card'
import { TASK_STATUS } from '@/lib/constants'

export function TaskKanban() {
  const { currentProjectId } = useStore()
  const { data: allTasks = [], isLoading } = useTasks(currentProjectId)
  
  const pendingTasks = allTasks.filter(task => task.status === TASK_STATUS.PENDING)
  const processingTasks = allTasks.filter(task => task.status === TASK_STATUS.PROCESSING)
  const failedTasks = allTasks.filter(task => task.status === TASK_STATUS.FAILED)

  const columns = [
    {
      title: '等待中',
      tasks: pendingTasks,
      emptyMessage: '暂无待处理任务'
    },
    {
      title: '进行中',
      tasks: processingTasks,
      emptyMessage: '暂无处理中任务'
    },
    {
      title: '失败',
      tasks: failedTasks,
      emptyMessage: '暂无失败任务'
    }
  ]

  if (!currentProjectId) {
    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-3 gap-6 h-full">
          {columns.map((column) => (
            <Card key={column.title} className="flex flex-col">
              <CardHeader className="flex-shrink-0 pb-4">
                <CardTitle className="text-base font-semibold">
                  {column.title} (0)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-sm text-muted-foreground">
                  请先选择一个项目
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-6 h-full min-h-[500px]">
        {columns.map((column) => (
          <Card key={column.title} className="flex flex-col">
            <CardHeader className="flex-shrink-0 pb-4">
              <CardTitle className="text-base font-semibold">
                {column.title} ({column.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                </div>
              ) : column.tasks.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-sm text-muted-foreground">
                    {column.emptyMessage}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}