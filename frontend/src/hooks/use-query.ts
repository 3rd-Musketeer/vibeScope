'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useStore } from '@/lib/store'
import { QueryRequest, QueryResponse } from '@/lib/types'

export function useQuery() {
  const { currentProjectToken } = useStore()
  
  return useMutation<QueryResponse, Error, QueryRequest>({
    mutationFn: (request: QueryRequest) => api.queryProject(request, currentProjectToken!),
    onError: (error) => {
      console.error('Query failed:', error)
    }
  })
}