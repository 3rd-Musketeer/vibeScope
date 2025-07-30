import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useChatStore } from '@/lib/store'

export function useChat(projectId: string | null) {
  const { addMessage } = useChatStore()
  
  return useMutation({
    mutationFn: (message: string) => {
      if (!projectId) throw new Error('No project selected')
      
      addMessage({ role: 'user', content: message })
      
      return api.sendChatMessage(projectId, message)
    },
    onSuccess: (data) => {
      addMessage({ role: 'assistant', content: data.response })
    },
    onError: (error) => {
      addMessage({ 
        role: 'assistant', 
        content: `抱歉，发生了错误：${error.message}` 
      })
    }
  })
}

export function useSearchTasks() {
  return useMutation({
    mutationFn: ({ projectId, query }: { projectId: string; query: string }) =>
      api.searchTasks(projectId, query)
  })
}