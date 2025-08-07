'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Plus, Chrome, Download, Settings } from 'lucide-react'
import { useCreateTask } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TaskCreateRequest } from '@/lib/types'

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
    
    const taskData: TaskCreateRequest = {
      project_id: currentProjectId,
      ...(activeTab === 'url' ? { url: url.trim() } : { html: html.trim() })
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">URL 输入</TabsTrigger>
              <TabsTrigger value="html">HTML 输入</TabsTrigger>
              <TabsTrigger value="extension">浏览器扩展</TabsTrigger>
            </TabsList>
            
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">网页 URL</Label>
                <Input
                  id="url"
                  placeholder="https://example.com/page..."
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
            
            <TabsContent value="extension" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Chrome className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium">浏览器扩展设置</h3>
                </div>
                
                <Alert>
                  <AlertDescription>
                    使用浏览器扩展可以直接在网页上选择内容并提交处理，无需手动复制URL或HTML。
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <Download className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">1. 安装扩展</h4>
                      <p className="text-sm text-muted-foreground">从Chrome Web Store或手动安装开发版本</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <Settings className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">2. 配置认证密钥</h4>
                      <p className="text-sm text-muted-foreground">点击页面顶部的&ldquo;Extension Setup&rdquo;按钮生成认证密钥</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-1 mt-0.5">
                      <Chrome className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">3. 开始使用</h4>
                      <p className="text-sm text-muted-foreground">在目标网页上激活扩展，选择内容并提交处理</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 提示：扩展会自动将内容提交到当前选择的项目，处理结果会在任务看板中实时显示。
                  </p>
                </div>
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