'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Link } from 'lucide-react'
import { useCreateTask } from '@/hooks/use-tasks'
import { useStore } from '@/lib/store'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Universal URL extraction from text
const extractUrlFromText = (text: string): string | null => {
  // Universal URL regex - works for any domain
  const urlRegex = /https?:\/\/[^\s<>"'\u00A0]+/g
  const matches = text.match(urlRegex)
  return matches ? matches[0] : null
}

export function UrlInputBar() {
  const [inputValue, setInputValue] = useState('')
  const { currentProjectId } = useStore()
  const { mutate: createTask, isPending, error } = useCreateTask()

  const handleSubmit = () => {
    if (!currentProjectId || !inputValue.trim() || isPending) {
      return
    }

    // Extract URL from mixed text or use as-is if it's already a URL
    const extractedUrl = extractUrlFromText(inputValue.trim())
    const finalUrl = extractedUrl || inputValue.trim()

    // Basic URL validation
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      return
    }

    const taskData = {
      project_id: currentProjectId,
      url: finalUrl,
    }

    createTask(taskData, {
      onSuccess: () => {
        setInputValue('') // Clear input on success
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const detectedUrl = inputValue.trim() ? extractUrlFromText(inputValue.trim()) : null
  const isValidInput = inputValue.trim() && (
    inputValue.trim().startsWith('http://') || 
    inputValue.trim().startsWith('https://') || 
    detectedUrl
  )

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="粘贴内容或URL..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={!currentProjectId || isPending}
                className="pl-10 h-11"
              />
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={!isValidInput || !currentProjectId || isPending}
              size="default"
              className="h-11 px-6"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  <span>添加任务</span>
                </>
              )}
            </Button>
          </div>

          {/* URL Detection Feedback */}
          {detectedUrl && detectedUrl !== inputValue.trim() && (
            <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
              检测到URL: {detectedUrl}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600 text-sm">
                {error.message || '添加任务失败，请重试'}
              </AlertDescription>
            </Alert>
          )}

          {/* Project Selection Reminder */}
          {!currentProjectId && (
            <div className="text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
              请先选择一个项目
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}