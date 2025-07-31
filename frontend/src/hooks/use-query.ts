'use client'

import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { QueryRequest, QueryResponse } from '@/lib/types'

export function useQuery() {
  return useMutation<QueryResponse, Error, QueryRequest>({
    mutationFn: (request: QueryRequest) => api.queryProject(request),
    onError: (error) => {
      console.error('Query failed:', error)
    }
  })
}