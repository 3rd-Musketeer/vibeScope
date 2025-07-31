'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@/hooks/use-query'
import { useStore, useQueryStore } from '@/lib/store'

export function QueryInterface() {
  const [question, setQuestion] = useState('')
  const { currentProjectId } = useStore()
  const { setRelevantNoteIds, clearRelevantNoteIds } = useQueryStore()
  const { mutate: submitQuery, data: queryResponse, isPending, error, reset } = useQuery()

  const handleSubmit = () => {
    if (!question.trim() || !currentProjectId || isPending) return

    submitQuery({
      project_id: currentProjectId,
      question: question.trim()
    }, {
      onSuccess: (response) => {
        setRelevantNoteIds(response.relevant_note_ids)
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setQuestion('')
    reset()
    clearRelevantNoteIds()
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            AI 问答
          </div>
          {queryResponse && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              清除
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Question Input Area */}
        <div className="mb-4">
          <div className="flex space-x-2">
            <Input
              placeholder="询问关于项目内容的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!currentProjectId || isPending}
              className="flex-1"
            />
            <Button 
              onClick={handleSubmit}
              disabled={!question.trim() || !currentProjectId || isPending}
              size="sm"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentProjectId ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
              请先选择一个项目开始提问
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-red-800">查询失败</div>
                    <div className="text-sm text-red-600 mt-1">
                      {error.message || '请稍后重试'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : queryResponse ? (
            <Card>
              <CardContent className="p-4">
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-muted-foreground mb-2">
                    相关笔记: {queryResponse.relevant_note_ids.length} 条
                  </div>
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {queryResponse.answer}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <div className="text-muted-foreground text-sm mb-2">
                向 AI 提问关于项目内容
              </div>
              <div className="text-xs text-muted-foreground">
                AI 将分析所有成功爬取的笔记并给出答案
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}