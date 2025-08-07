'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Trash, Eye, EyeOff } from 'lucide-react'
import { logger, LogEntry } from '@/lib/logger'

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')

  useEffect(() => {
    if (isVisible) {
      setLogs(logger.getLogs())
    }
  }, [isVisible])

  const filteredLogs = logs.filter(log => 
    filter === 'all' || log.level === filter
  ).slice(-50) // Show only last 50 logs for performance

  const levelColors = {
    error: 'destructive',
    warn: 'secondary',
    info: 'default',
    debug: 'outline'
  } as const

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background"
        >
          <Eye className="h-4 w-4 mr-2" />
          Debug Logs
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50">
      <Card className="max-h-96 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Logs ({logs.length})</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs px-2 py-1 border rounded"
              >
                <option value="all">All</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
              </select>
              <Button
                onClick={() => logger.downloadLogs()}
                size="sm"
                variant="ghost"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => {
                  logger.clearLogs()
                  setLogs([])
                }}
                size="sm"
                variant="ghost"
              >
                <Trash className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                size="sm"
                variant="ghost"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No logs to display
              </p>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="text-xs border-b pb-2 last:border-b-0">
                  <div className="flex items-start justify-between mb-1">
                    <Badge variant={levelColors[log.level]} className="text-xs px-1 py-0">
                      {log.level.toUpperCase()}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs break-words">{log.message}</p>
                  {log.context && (
                    <details className="mt-1">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Context
                      </summary>
                      <pre className="text-xs bg-muted p-1 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.stack && (
                    <details className="mt-1">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        Stack Trace
                      </summary>
                      <pre className="text-xs bg-red-50 p-1 rounded mt-1 overflow-x-auto text-red-800">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}