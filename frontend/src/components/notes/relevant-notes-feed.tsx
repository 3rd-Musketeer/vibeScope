'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, User } from 'lucide-react'
import { useStore, useQueryStore } from '@/lib/store'
import { useSuccessfulTasks } from '@/hooks/use-tasks'
import { TaskModal } from '@/components/tasks/task-modal'
import { getThumbnailUrl } from '@/lib/utils'
import Image from 'next/image'
import { useMemo } from 'react'

export function RelevantNotesFeed() {
  const { currentProjectId } = useStore()
  const { relevantNoteIds } = useQueryStore()
  const { data: successfulTasks = [] } = useSuccessfulTasks(currentProjectId)

  const relevantTasks = useMemo(() => {
    if (!relevantNoteIds || relevantNoteIds.length === 0) return []
    return successfulTasks.filter(task => relevantNoteIds.includes(task.id))
  }, [successfulTasks, relevantNoteIds])

  if (!currentProjectId) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className="text-sm font-medium">相关笔记</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-xs text-muted-foreground">
            请先选择项目
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="text-sm font-medium">相关笔记 ({relevantTasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {relevantTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-xs text-muted-foreground">
              暂无相关笔记
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="space-y-3 p-4">
              {relevantTasks.map((task) => (
                <TaskModal key={task.id} task={task}>
                  <Card className="cursor-pointer hover:shadow-sm transition-shadow duration-200 border-l-2 border-l-blue-500">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-xs line-clamp-2 leading-4">
                            {task.base_content.title}
                          </h4>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </div>
                        
                        {task.image_assets.length > 0 && (
                          <Image
                            src={getThumbnailUrl(task.image_assets[0])}
                            alt="预览图"
                            width={240}
                            height={80}
                            className="w-full h-20 object-cover rounded-sm"
                          />
                        )}
                        
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-2.5 h-2.5" />
                          <span className="truncate text-xs">{task.author_profile.author_name}</span>
                          <span>•</span>
                          <span className="text-xs">{task.metadata.like_count} 赞</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-3">
                          {task.base_content.content}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TaskModal>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}