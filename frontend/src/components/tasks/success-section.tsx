'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, User } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useSuccessfulTasks } from '@/hooks/use-tasks'
import { useStore, useQueryStore } from '@/lib/store'
import { TaskModal } from './task-modal'
import { getThumbnailUrl } from '@/lib/utils'
import Image from 'next/image'

export function SuccessSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProjectId } = useStore()
  const { relevantNoteIds } = useQueryStore()
  const { data: successfulTasks = [], isLoading } = useSuccessfulTasks(currentProjectId)

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return successfulTasks
    
    // Client-side search since backend RAG search endpoint is not implemented yet
    const query = searchQuery.toLowerCase()
    return successfulTasks.filter(task => 
      task.base_content.title.toLowerCase().includes(query) ||
      task.base_content.content.toLowerCase().includes(query) ||
      task.metadata.tags.some(tag => tag.toLowerCase().includes(query)) ||
      task.author_profile.author_name.toLowerCase().includes(query)
    )
  }, [successfulTasks, searchQuery])

  if (!currentProjectId) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 pb-4">
          <CardTitle className="text-base font-semibold">成功数据 (0)</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-sm text-muted-foreground">
            请先选择一个项目
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="text-base font-semibold mb-4">成功数据 ({successfulTasks.length})</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索标题、内容、标签或作者..." 
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-sm text-muted-foreground">
              加载中...
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-sm text-muted-foreground">
              {searchQuery ? '没有找到匹配的数据' : '暂无成功抓取的数据'}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredTasks.map((task) => {
              const isRelevant = relevantNoteIds.includes(task.id)
              return (
                <TaskModal key={task.id} task={task}>
                  <Card className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                    isRelevant ? 'ring-2 ring-orange-500 ring-offset-2' : ''
                  }`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 标题和链接 */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm line-clamp-2 leading-5">
                          {task.base_content.title}
                        </h3>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-1" />
                      </div>
                      
                      {/* 第一张图片 */}
                      {task.image_assets.length > 0 && (
                        <Image
                          src={getThumbnailUrl(task.image_assets[0])}
                          alt="预览图"
                          width={320}
                          height={128}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      )}
                      
                      {/* 作者信息 */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span className="truncate">{task.author_profile.author_name}</span>
                        <span>•</span>
                        <span>{task.metadata.like_count} 赞</span>
                      </div>
                      
                      {/* 内容预览 */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-4">
                        {task.base_content.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TaskModal>
            )
            })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}