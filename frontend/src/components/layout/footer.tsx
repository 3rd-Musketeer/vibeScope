import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="flex-shrink-0 border-t bg-background px-6 py-3">
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>© 2025 vibeScope | v0.1</span>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground">
              关于
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>关于 vibeScope</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                vibeScope 是自然语言驱动的内容分析平台，帮助您：
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>从任意网站提取内容进行分析</li>
                <li>使用 AI 进行智能内容理解与问答</li>
                <li>支持浏览器扩展与数据导出</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                技术栈：Next.js 15 + React 19 + TanStack Query + shadcn/ui
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  )
}