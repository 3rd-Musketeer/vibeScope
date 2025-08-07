'use client'

import { QueryInterface } from '@/components/query/query-interface'
import { TaskKanban } from '@/components/tasks/task-kanban'
import { UrlInputBar } from '@/components/tasks/url-input-bar'
import { NotesGrid } from '@/components/notes/notes-grid'
import { RelevantNotesFeed } from '@/components/notes/relevant-notes-feed'

interface TabbedMainAreaProps {
  activeTab: string
}

export function TabbedMainArea({ activeTab }: TabbedMainAreaProps) {
  return (
    <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
      {/* Notes Tab Content */}
      {activeTab === 'notes' && (
        <div className="flex-1 min-h-0">
          <NotesGrid />
        </div>
      )}
      
      {/* Analysis Tab Content */}
      {activeTab === 'analysis' && (
        <div className="flex-1 flex gap-6 min-h-0">
          <div className="w-80 flex-shrink-0 min-h-0">
            <RelevantNotesFeed />
          </div>
          <div className="flex-1 min-w-0 min-h-0">
            <QueryInterface />
          </div>
        </div>
      )}
      
      {/* Task Management Tab Content */}
      {activeTab === 'tasks' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 mb-6">
            <UrlInputBar />
          </div>
          <div className="flex-1 min-h-0">
            <TaskKanban />
          </div>
        </div>
      )}
    </main>
  )
}