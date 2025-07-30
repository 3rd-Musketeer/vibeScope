'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare, Bot, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useChatStore } from '@/lib/store'
import { useStore } from '@/lib/store'

export function ChatInterface() {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { currentProjectId } = useStore()
  const { messages, clearMessages } = useChatStore()
  const { mutate: sendMessage, isPending } = useChat(currentProjectId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!message.trim() || !currentProjectId || isPending) return
    
    const messageToSend = message.trim()
    setMessage('')
    sendMessage(messageToSend)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewConversation = () => {
    clearMessages()
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          AI 对话
          <Button variant="ghost" size="sm" onClick={handleNewConversation}>
            <MessageSquare className="w-4 h-4 mr-2" />
            新对话
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        <div className="flex-1 mb-4 overflow-y-auto">
          {!currentProjectId ? (
            <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
              请先选择一个项目开始对话
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-muted-foreground mb-4" />
              <div className="text-muted-foreground text-sm mb-2">
                开始与 AI 助手对话
              </div>
              <div className="text-xs text-muted-foreground">
                询问数据分析、搜索内容或获取洞察
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      msg.role === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2 max-w-[80%]">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="输入消息..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!currentProjectId || isPending}
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!message.trim() || !currentProjectId || isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}