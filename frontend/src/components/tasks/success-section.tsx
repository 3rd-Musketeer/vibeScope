'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, User } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useSuccessfulTasks } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { TaskModal } from './task-modal'

export function SuccessSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProjectId } = useStore()
  const { data: successfulTasks = [], isLoading } = useSuccessfulTasks(currentProjectId)

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return successfulTasks
    
    // Client-side search since backend RAG search endpoint is not implemented yet
    const query = searchQuery.toLowerCase()
    return successfulTasks.filter(task => 
      task.note_content.title.toLowerCase().includes(query) ||
      task.note_content.content.toLowerCase().includes(query) ||
      task.note_content.tags.some(tag => tag.toLowerCase().includes(query)) ||
      task.user_profile.author_name.toLowerCase().includes(query)
    )
  }, [successfulTasks, searchQuery])

  if (!currentProjectId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>成功数据 (0)</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          <div className="text-center text-muted-foreground py-12">
            请先选择一个项目
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>成功数据 ({successfulTasks.length})</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索标题、内容、标签或作者..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">
            加载中...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {searchQuery ? '没有找到匹配的数据' : '暂无成功抓取的数据'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskModal key={task.id} task={task}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 标题和链接 */}
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-sm line-clamp-2">
                          {task.note_content.title}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                      
                      {/* 第一张图片 */}
                      {task.image_base64.length > 0 && (
                        <img
                          src={task.image_base64[0]}
                          alt="预览图"
                          className="w-full h-32 object-cover rounded"
                        />
                      )}
                      
                      {/* 作者信息 */}
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{task.user_profile.author_name}</span>
                        <span>•</span>
                        <span>{task.note_content.like_count} 赞</span>
                      </div>
                      
                      {/* 内容预览 */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.note_content.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TaskModal>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}