import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { QUERY_KEYS, POLLING_INTERVAL } from '@/lib/constants'
import { TaskCreateRequest } from '@/lib/types'

export function useTasks(projectId: string | null, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, projectId, status],
    queryFn: () => api.getTasks(projectId!, status),
    enabled: !!projectId,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createTask,
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
  
  return useMutation({
    mutationFn: api.retryTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TASKS })
      
      const previousTasks = queryClient.getQueriesData({ 
        queryKey: QUERY_KEYS.TASKS 
      })
      
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.TASKS },
        (old: any) => {
          if (!old) return old
          return old.map((task: any) => 
            task.id === taskId 
              ? { ...task, status: 'pending', error_msg: null }
              : task
          )
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
  
  return useMutation({
    mutationFn: api.deleteTask,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.TASKS })
      
      const previousTasks = queryClient.getQueriesData({ 
        queryKey: QUERY_KEYS.TASKS 
      })
      
      queryClient.setQueriesData(
        { queryKey: QUERY_KEYS.TASKS },
        (old: any) => old?.filter((task: any) => task.id !== taskId)
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
  return useQuery({
    queryKey: QUERY_KEYS.QUEUE_STATUS,
    queryFn: api.getQueueStatus,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useSuccessfulTasks(projectId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.TASKS, projectId, 'successful'],
    queryFn: () => api.getSuccessfulTasks(projectId!),
    enabled: !!projectId,
    refetchInterval: POLLING_INTERVAL
  })
}