export const API_BASE = 'https://api.onehalf.tech'

export const POLLING_INTERVAL = 1000 // 1 seconds for real-time updates

export const TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  FAILED: 'failed'
} as const

export const QUERY_KEYS = {
  PROJECTS: ['projects'],
  TASKS: ['tasks'],
  QUEUE_STATUS: ['queue-status'],
  PROJECT_STATS: ['project-stats']
} as const