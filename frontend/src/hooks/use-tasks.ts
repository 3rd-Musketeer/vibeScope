import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { QUERY_KEYS, POLLING_INTERVAL } from '@/lib/constants'
import { useStore } from '@/lib/store'
import type { ExtractedContentResponse } from '@/lib/types'

export function useTasks(projectId: string | null, status?: string) {
  const { currentProjectToken } = useStore()
  
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, projectId, status],
    queryFn: () => api.getTasks(projectId!, currentProjectToken!, status),
    enabled: !!projectId && !!currentProjectToken,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { currentProjectToken } = useStore()
  
  return useMutation({
    mutationFn: (request: any) => api.createTask(request, currentProjectToken!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [...QUERY_KEYS.TASKS, data.project_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.QUEUE_STATUS 
      })
    }
  })
}

export function useRetryTask() {
  const queryClient = useQueryClient()
  const { currentProjectToken } = useStore()
  
  return useMutation({
    mutationFn: (taskId: string) => api.retryTask(taskId, currentProjectToken!),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TASKS })
      
      const previousTasks = queryClient.getQueriesData({ 
        queryKey: QUERY_KEYS.TASKS 
      })
      
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.TASKS },
        (old: unknown) => {
          if (!old) return old
          return Array.isArray(old) ? old.map((task: ExtractedContentResponse) => 
            task.id === taskId 
              ? { ...task, status: 'pending', error_msg: null }
              : task
          ) : old
        }
      )
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUEUE_STATUS })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { currentProjectToken } = useStore()
  
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(taskId, currentProjectToken!),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TASKS })
      
      const previousTasks = queryClient.getQueriesData({ 
        queryKey: QUERY_KEYS.TASKS 
      })
      
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.TASKS },
        (old: unknown) => Array.isArray(old) ? old.filter((task: { id: string }) => task.id !== taskId) : old
      )
      
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASKS })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.QUEUE_STATUS })
    }
  })
}

export function useQueueStatus() {
  const { currentProjectToken } = useStore()
  
  return useQuery({
    queryKey: QUERY_KEYS.QUEUE_STATUS,
    queryFn: () => api.getQueueStatus(currentProjectToken!),
    enabled: !!currentProjectToken,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useSuccessfulTasks(projectId: string | null) {
  const { currentProjectToken } = useStore()
  
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, projectId, 'successful'],
    queryFn: () => api.getExtractedContent(projectId!, currentProjectToken!),
    enabled: !!projectId && !!currentProjectToken,
    refetchInterval: POLLING_INTERVAL
  })
}

// Legacy hook for backward compatibility
export function useSuccessfulTasksLegacy(projectId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, projectId, 'successful-legacy'],
    queryFn: () => api.getSuccessfulTasks(projectId!),
    enabled: !!projectId,
    refetchInterval: POLLING_INTERVAL
  })
}