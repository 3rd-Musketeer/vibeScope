/**
 * Frontend Logger Utility
 * Logs to both console and local storage for debugging
 */

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: unknown
  stack?: string
}

class Logger {
  private maxLogs = 1000 // Keep last 1000 log entries
  private storageKey = 'app_logs'

  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private createLogEntry(level: LogEntry['level'], message: string, context?: unknown, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
    }

    if (context) {
      entry.context = context
    }

    if (error && error.stack) {
      entry.stack = error.stack
    }

    return entry
  }

  private persistLog(entry: LogEntry) {
    try {
      const existing = this.getLogs()
      existing.push(entry)
      
      // Keep only the last maxLogs entries
      const trimmed = existing.slice(-this.maxLogs)
      
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed))
    } catch (e) {
      // If localStorage is full or unavailable, just log to console
      console.warn('Failed to persist log to localStorage:', e)
    }
  }

  private logToConsole(entry: LogEntry) {
    const { timestamp, level, message, context } = entry
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    
    switch (level) {
      case 'error':
        console.error(logMessage, context || '')
        break
      case 'warn':
        console.warn(logMessage, context || '')
        break
      case 'info':
        console.info(logMessage, context || '')
        break
      case 'debug':
        console.debug(logMessage, context || '')
        break
    }
  }

  info(message: string, context?: unknown) {
    const entry = this.createLogEntry('info', message, context)
    this.logToConsole(entry)
    this.persistLog(entry)
  }

  warn(message: string, context?: unknown) {
    const entry = this.createLogEntry('warn', message, context)
    this.logToConsole(entry)
    this.persistLog(entry)
  }

  error(message: string, context?: unknown, error?: Error) {
    const entry = this.createLogEntry('error', message, context, error)
    this.logToConsole(entry)
    this.persistLog(entry)
  }

  debug(message: string, context?: unknown) {
    const entry = this.createLogEntry('debug', message, context)
    this.logToConsole(entry)
    this.persistLog(entry)
  }

  getLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      console.warn('Failed to retrieve logs from localStorage:', e)
      return []
    }
  }

  clearLogs() {
    localStorage.removeItem(this.storageKey)
  }

  exportLogs(): string {
    const logs = this.getLogs()
    return JSON.stringify(logs, null, 2)
  }

  downloadLogs() {
    const logs = this.exportLogs()
    const blob = new Blob([logs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `frontend-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

export const logger = new Logger()

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error(`Uncaught error: ${event.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error(`Unhandled promise rejection: ${event.reason}`, {
      promise: event.promise
    })
  })
}