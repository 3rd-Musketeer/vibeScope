'use client'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle, AlertCircle, Sparkles, FileText, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@/hooks/use-query'
import { useStore, useQueryStore } from '@/lib/store'
import ReactMarkdown from 'react-markdown'

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

  const handleNewQuestion = () => {
    setQuestion('')
    reset()
    clearRelevantNoteIds()
  }

  if (!currentProjectId) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">AI 智能问答</h3>
              <p className="text-sm text-muted-foreground">请先选择一个项目开始提问</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">AI 智能问答</h2>
              <p className="text-xs text-muted-foreground">基于项目笔记的智能分析</p>
            </div>
          </div>
          {queryResponse && (
            <Button variant="outline" size="sm" onClick={handleNewQuestion} className="gap-2">
              <RotateCcw className="w-3 h-3" />
              新问题
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {queryResponse && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* User Question */}
             <div className="flex justify-end">
               <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3">
                 <p className="text-sm">{question}</p>
               </div>
             </div>

            {/* AI Response */}
            <div className="flex justify-start">
              <div className="max-w-[90%] space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span>AI 助手</span>
                  <div className="flex items-center gap-1 ml-2">
                    <FileText className="w-3 h-3" />
                    <span>基于 {queryResponse.relevant_note_ids.length} 条相关笔记</span>
                  </div>
                </div>
                <Card className="bg-muted/30 border-0 shadow-none">
                  <div className="p-4">
                    <div className="prose prose-sm max-w-none text-foreground">
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 pl-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-2">{children}</ol>,
                          li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => <code className="bg-background px-2 py-1 rounded text-xs font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-background p-3 rounded text-xs overflow-x-auto mb-3">{children}</pre>,
                        }}
                      >
                        {queryResponse.answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="border-destructive/20 bg-destructive/5 max-w-md">
              <div className="p-4 text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-medium text-destructive">查询失败</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {error.message || '请稍后重试'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => reset()}>
                  重试
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!queryResponse && !error && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">开始智能问答</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  向 AI 提问关于项目内容的任何问题，我会分析所有相关笔记为您提供准确答案
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-6 pt-4 border-t bg-background/50">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="询问关于项目内容的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
              className="pr-12 h-11 bg-background"
            />
            {isPending && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <Button 
            onClick={handleSubmit}
            disabled={!question.trim() || isPending}
            size="default"
            className="h-11 px-6 gap-2"
          >
            <Send className="w-4 h-4" />
            发送
          </Button>
        </div>
      </div>
    </div>
  )
}