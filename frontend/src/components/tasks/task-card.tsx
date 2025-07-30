import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RotateCcw, Trash2, ExternalLink, Clock, Play, XCircle } from 'lucide-react'
import { TaskResponse } from '@/lib/types'
import { useRetryTask, useDeleteTask } from '@/hooks/use-tasks'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TaskCardProps {
  task: TaskResponse
}

const statusIcons = {
  pending: Clock,
  processing: Play,
  failed: XCircle
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800', 
  failed: 'bg-red-100 text-red-800'
}

export function TaskCard({ task }: TaskCardProps) {
  const { mutate: retryTask, isPending: isRetrying } = useRetryTask()
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask()
  
  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons]
  
  const handleRetry = () => {
    retryTask(task.id)
  }
  
  const handleDelete = () => {
    deleteTask(task.id)
  }
  
  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname + urlObj.pathname.slice(0, 30) + (urlObj.pathname.length > 30 ? '...' : '')
    } catch {
      return url.slice(0, 50) + (url.length > 50 ? '...' : '')
    }
  }

  return (
    <Card className="mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className="w-4 h-4" />
            <Badge className={statusColors[task.status as keyof typeof statusColors]}>
              {task.status === 'pending' && '等待中'}
              {task.status === 'processing' && '进行中'}
              {task.status === 'failed' && '失败'}
            </Badge>
          </div>
          
          <div className="flex space-x-1">
            {task.status === 'failed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetry}
                disabled={isRetrying}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
            <span className="truncate" title={task.url}>
              {getDisplayUrl(task.url)}
            </span>
          </div>
          
          {task.error_msg && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {task.error_msg}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            创建于 {formatDistanceToNow(new Date(task.created_at), { 
              addSuffix: true, 
              locale: zhCN 
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}