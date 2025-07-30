import { TaskKanban } from '@/components/tasks/task-kanban'
import { SuccessSection } from '@/components/tasks/success-section'

export function MainArea() {
  return (
    <main className="flex-[2] p-8 overflow-y-auto">
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">任务看板</h2>
          <TaskKanban />
        </div>
        <div>
          <SuccessSection />
        </div>
      </div>
    </main>
  )
}