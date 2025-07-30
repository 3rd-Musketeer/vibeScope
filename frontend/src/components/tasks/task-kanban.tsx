'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTasks } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { TaskCard } from './task-card'
import { AddTaskModal } from './add-task-modal'
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
      showAddButton: true,
      emptyMessage: '暂无待处理任务'
    },
    {
      title: '进行中',
      tasks: processingTasks,
      showAddButton: false,
      emptyMessage: '暂无处理中任务'
    },
    {
      title: '失败',
      tasks: failedTasks,
      showAddButton: false,
      emptyMessage: '暂无失败任务'
    }
  ]

  if (!currentProjectId) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => (
          <Card key={column.title}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {column.title} (0)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[200px]">
              <div className="text-center text-sm text-muted-foreground py-8">
                请先选择一个项目
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {columns.map((column) => (
        <Card key={column.title}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{column.title} ({column.tasks.length})</span>
              {column.showAddButton && <AddTaskModal />}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px] max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                加载中...
              </div>
            ) : column.tasks.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                {column.emptyMessage}
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
  )
}