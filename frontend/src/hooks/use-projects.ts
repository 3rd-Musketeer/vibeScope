import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { QUERY_KEYS, POLLING_INTERVAL } from '@/lib/constants'

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECTS,
    queryFn: api.getProjects,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS })
    }
  })
}

export function useProjectStats(projectId: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PROJECT_STATS, projectId],
    queryFn: () => api.getProjectStats(projectId!),
    enabled: !!projectId,
    refetchInterval: POLLING_INTERVAL
  })
}

export function useExportProject() {
  return useMutation({
    mutationFn: api.exportProjectData,
    onSuccess: (data, projectId) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${projectId}-export.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  })
}