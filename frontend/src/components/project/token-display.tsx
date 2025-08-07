'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function TokenDisplay() {
  const { currentProjectId } = useStore()
  const [copied, setCopied] = useState(false)
  const [showToken, setShowToken] = useState(false)

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: api.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const currentProject = projects?.find(p => p.id === currentProjectId)

  if (!currentProject) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a project to view token
      </div>
    )
  }

  const copyToken = async () => {
    if (!currentProject.auth_token) return
    
    try {
      await navigator.clipboard.writeText(currentProject.auth_token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy token:', err)
    }
  }

  const displayToken = showToken 
    ? currentProject.auth_token 
    : `${currentProject.auth_token.slice(0, 8)}...${currentProject.auth_token.slice(-4)}`

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm">
        <span className="text-muted-foreground">Token: </span>
        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
          {displayToken}
        </code>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowToken(!showToken)}
        className="h-6 w-6 p-0"
      >
        {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToken}
        className="h-6 w-6 p-0"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}