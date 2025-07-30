'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { useCreateTask } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function AddTaskModal() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [html, setHtml] = useState('')
  const [activeTab, setActiveTab] = useState('url')
  
  const { currentProjectId } = useStore()
  const { mutate: createTask, isPending, error } = useCreateTask()
  
  const handleSubmit = () => {
    if (!currentProjectId) {
      return
    }
    
    const taskData = {
      project_id: currentProjectId,
      url: activeTab === 'url' ? url : undefined,
      html: activeTab === 'html' ? html : undefined
    }
    
    createTask(taskData, {
      onSuccess: () => {
        setUrl('')
        setHtml('')
        setOpen(false)
      }
    })
  }
  
  const isValid = currentProjectId && (
    (activeTab === 'url' && url.trim()) || 
    (activeTab === 'html' && html.trim())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加新任务</DialogTitle>
        </DialogHeader>
        
        {!currentProjectId && (
          <Alert>
            <AlertDescription>
              请先选择或创建一个项目
            </AlertDescription>
          </Alert>
        )}
        
        {currentProjectId && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL 输入</TabsTrigger>
              <TabsTrigger value="html">HTML 输入</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">网页 URL</Label>
                <Input
                  id="url"
                  placeholder="https://xiaohongshu.com/item/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="html" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="html">HTML 内容</Label>
                <Textarea
                  id="html"
                  placeholder="粘贴网页 HTML 内容..."
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={6}
                />
              </div>
            </TabsContent>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error.message || '添加任务失败'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!isValid || isPending}
              >
                {isPending ? '添加中...' : '添加任务'}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}