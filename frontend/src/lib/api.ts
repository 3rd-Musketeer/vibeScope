import { 
  ProjectSchema, 
  TaskResponse, 
  TaskCreateRequest,
  ProjectStatsResponse,
  ExtractedContentResponse,
  ProjectExportResponse,
  QueryRequest,
  QueryResponse,
} from './types'
import { API_BASE } from './constants'

export const api = {
  // Project management
  getProjects: (): Promise<ProjectSchema[]> => {
    const token = localStorage.getItem('system_auth_token')
    return fetch(`${API_BASE}/projects`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('system_auth_token')
          window.location.href = '/login'
          return []
        }
        throw new Error('Failed to fetch projects')
      }
      return res.json()
    })
  },
  
  createProject: (name: string): Promise<ProjectSchema> => {
    const token = localStorage.getItem('system_auth_token')
    return fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ name })
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('system_auth_token')
          window.location.href = '/login'
          throw new Error('Authentication required')
        }
        throw new Error('Failed to create project')
      }
      return res.json()
    })
  },

  deleteProject: (projectId: string, token: string): Promise<void> =>
    fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to delete project')
    }),

  // Project token-based endpoints (require auth token in headers)
  getProjectByToken: (token: string): Promise<{id: string, name: string}> =>
    fetch(`${API_BASE}/projects/by-token/${token}`).then(res => {
      if (!res.ok) throw new Error('Invalid token')
      return res.json()
    }),

  getProjectStats: (projectId: string, token: string): Promise<ProjectStatsResponse> =>
    fetch(`${API_BASE}/projects/${projectId}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

  exportProjectData: (projectId: string, token: string): Promise<ProjectExportResponse> =>
    fetch(`${API_BASE}/projects/${projectId}/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

  // Task management
  getTasks: (projectId: string, token: string, status?: string): Promise<TaskResponse[]> => {
    const url = new URL(`${API_BASE}/tasks/${projectId}`)
    if (status) url.searchParams.set('status', status)
    return fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json())
  },

  getExtractedContent: (projectId: string, token: string): Promise<ExtractedContentResponse[]> =>
    fetch(`${API_BASE}/projects/${projectId}/content`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

  createTask: (request: TaskCreateRequest, token: string): Promise<TaskResponse> =>
    fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    }).then(res => res.json()),

  retryTask: (taskId: string, token: string): Promise<void> =>
    fetch(`${API_BASE}/tasks/${taskId}/retry`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('重试失败')
    }),

  deleteTask: (taskId: string, token: string): Promise<void> =>
    fetch(`${API_BASE}/tasks/${taskId}/delete`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
      if (!res.ok) throw new Error('删除失败')
    }),

  // Queue status
  getQueueStatus: (token: string): Promise<{pending: number; processing: number; failed: number}> =>
    fetch(`${API_BASE}/queue/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

  // RAG Query System
  queryProject: (request: QueryRequest, token: string): Promise<QueryResponse> =>
    fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    }).then(res => {
      if (!res.ok) {
        throw new Error(`Query failed: ${res.statusText}`)
      }
      return res.json()
    }),
}