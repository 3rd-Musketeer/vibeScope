import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="border-t bg-background px-6 py-2">
      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
        <span>© 2025 产品调研助手 | v0.1</span>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
              关于
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>关于产品调研助手</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                产品调研助手是一个社交媒体内容爬取与分析工具，帮助您：
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>批量爬取小红书等平台内容</li>
                <li>使用 LLM 进行智能内容分析</li>
                <li>支持 AI 问答与数据导出</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                技术栈：Next.js 15 + React 19 + TanStack Query + shadcn/ui
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  )
}