# Frontend Implementation Plan - MVP (2025)

## File Structure
```
frontend/
├── src/
│   ├── app/                          # Next.js 15 app router
│   │   ├── layout.tsx               # Root layout with React 19 support
│   │   ├── page.tsx                 # Main dashboard page
│   │   └── globals.css              # Tailwind v4 with inline config
│   ├── components/                   # UI components
│   │   ├── ui/                      # shadcn/ui components (new-york style)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...                  # Other shadcn components as needed
│   │   ├── layout/                  # Layout components
│   │   │   ├── header.tsx           # Top bar with project management + stats
│   │   │   ├── main-area.tsx        # Central task kanban + success section
│   │   │   ├── left-sidebar.tsx     # Statistics charts
│   │   │   ├── right-sidebar.tsx    # AI chat interface
│   │   │   └── footer.tsx           # Simple copyright
│   │   ├── project/                 # Project management
│   │   │   ├── project-selector.tsx # fzf-like project search
│   │   │   └── stats-cards.tsx      # Real-time statistics display
│   │   ├── tasks/                   # Task management
│   │   │   ├── task-kanban.tsx      # Three-column kanban board
│   │   │   ├── task-card.tsx        # Individual task card component
│   │   │   ├── task-modal.tsx       # Task detail modal (success/failed)
│   │   │   ├── add-task-modal.tsx   # URL/HTML input modal
│   │   │   └── success-section.tsx  # Search + success cards grid
│   │   ├── chat/                    # AI chat components
│   │   │   ├── chat-interface.tsx   # Complete chat UI
│   │   │   ├── message-bubble.tsx   # Individual message component
│   │   │   └── chat-input.tsx       # Input field + send button
│   │   └── charts/                  # Statistics charts
│   │       ├── charts-sidebar.tsx   # Chart container
│   │       └── chart-modal.tsx      # Expanded chart view
│   ├── lib/                         # Utilities and configurations
│   │   ├── api.ts                   # API client with TanStack Query
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── utils.ts                 # Utility functions (cn, etc.)
│   │   ├── constants.ts             # App constants
│   │   └── store.ts                 # Zustand store for client state
│   └── hooks/                       # Custom React hooks
│       ├── use-projects.ts          # Project management with TanStack Query
│       ├── use-tasks.ts             # Task management hooks
│       ├── use-polling.ts           # Real-time polling hook
│       └── use-chat.ts              # Chat state management
└── package.json                     # Dependencies and scripts
```

## Implementation Order

### 1. Project Setup & Dependencies
- Initialize Next.js 15 project with TypeScript and Tailwind
- Install shadcn/ui with new-york style
- Install TanStack Query, Zustand, react-markdown, echarts
- Configure project structure with src/ directory

### 2. Core Configuration
- Set up root layout with React 19 support
- Configure global styles with Tailwind v4 inline config
- Set up main page with basic dashboard layout structure

### 3. Type Definitions & API Client
- Mirror all backend schemas as TypeScript interfaces
- Create API client functions for all backend endpoints
- Add utility functions and constants
- Set up Zustand store for client state

### 4. Custom Hooks
- Create polling hook for real-time data updates
- Create project hooks with TanStack Query
- Create task hooks with optimistic updates
- Create chat hooks for message management

### 5. Layout Components
- Create header component with flex layout
- Create main area with vertical split layout
- Create left sidebar container for charts
- Create right sidebar container for chat
- Create footer with copyright

### 6. Project Management
- Create project selector with fuzzy search
- Create statistics cards with real-time polling
- Add export functionality with JSON download

### 7. Task Management
- Create task card component with status styling
- Create add task modal with URL/HTML input
- Create task kanban with three-column layout
- Create success section with search and grid
- Create task detail modal with markdown rendering
- Add task actions (retry, delete) with optimistic updates

### 8. Chat Interface
- Create message bubble with user/AI styling
- Create chat input with send functionality
- Create complete chat interface assembly

### 9. Statistics Charts
- Create charts sidebar with small Echarts displays
- Create chart modal with full-size expansion
- Connect with project statistics data

### 10. Integration & Polish
- Connect real-time polling across components
- Add error handling and loading states
- Apply visual polish and responsive design

## Fine-Grained Development Todo List

### Project Setup & Dependencies (4 tasks)
1. **Initialize Next.js project** - `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
2. **Install shadcn/ui** - `npx shadcn@latest init` with new-york style and install core components
3. **Install additional dependencies** - TanStack Query, Zustand, react-markdown, echarts-for-react, react-use-websocket
4. **Configure project structure** - Create all directories and basic file stubs

### Core Configuration (3 tasks)
5. **Set up root layout** - `src/app/layout.tsx` with HTML structure, providers, and metadata
6. **Configure global styles** - `src/app/globals.css` with Tailwind v4 inline config and CSS variables
7. **Set up main page** - `src/app/page.tsx` with basic dashboard layout structure

### Type Definitions & API Client (4 tasks)
8. **Define TypeScript interfaces** - Mirror all backend schemas in `src/lib/types.ts`
9. **Create API client** - `src/lib/api.ts` with functions for all 8 backend endpoints
10. **Add utility functions** - `src/lib/utils.ts` with cn() helper and other utilities
11. **Set up Zustand store** - `src/lib/store.ts` for client state management

### Custom Hooks (4 tasks)
12. **Create polling hook** - `src/hooks/use-polling.ts` for real-time data updates
13. **Create project hooks** - `src/hooks/use-projects.ts` with TanStack Query integration
14. **Create task hooks** - `src/hooks/use-tasks.ts` with optimistic updates and status filtering
15. **Create chat hooks** - `src/hooks/use-chat.ts` with message state and API calls

### Layout Components (5 tasks)
16. **Create header component** - `src/components/layout/header.tsx` with flex layout
17. **Create main area component** - `src/components/layout/main-area.tsx` with vertical split
18. **Create left sidebar** - `src/components/layout/left-sidebar.tsx` container for charts
19. **Create right sidebar** - `src/components/layout/right-sidebar.tsx` container for chat
20. **Create footer component** - `src/components/layout/footer.tsx` with copyright and about modal

### Project Management (3 tasks)
21. **Create project selector** - `src/components/project/project-selector.tsx` with fuzzy search and create/open logic
22. **Create statistics cards** - `src/components/project/stats-cards.tsx` with real-time polling and card layout
23. **Add export functionality** - Export button with JSON download capability

### Task Management (6 tasks)
24. **Create task card component** - `src/components/tasks/task-card.tsx` with status styling and click handlers
25. **Create add task modal** - `src/components/tasks/add-task-modal.tsx` with URL/HTML input tabs and validation
26. **Create task kanban** - `src/components/tasks/task-kanban.tsx` with three-column layout
27. **Create success section** - `src/components/tasks/success-section.tsx` with search bar and card grid
28. **Create task detail modal** - `src/components/tasks/task-modal.tsx` with markdown rendering and image display
29. **Add task actions** - Retry and delete functionality with optimistic updates

### Chat Interface (3 tasks)
30. **Create message bubble** - `src/components/chat/message-bubble.tsx` with user/AI styling and markdown support
31. **Create chat input** - `src/components/chat/chat-input.tsx` with send button and enter key handling
32. **Create chat interface** - `src/components/chat/chat-interface.tsx` with message list and new conversation

### Statistics Charts (2 tasks)
33. **Create charts sidebar** - `src/components/charts/charts-sidebar.tsx` with small Echarts displays
34. **Create chart modal** - `src/components/charts/chart-modal.tsx` with full-size chart expansion

### Integration & Polish (3 tasks)
35. **Connect real-time polling** - Integrate polling hooks across all components for live updates
36. **Add error handling** - Loading states, error boundaries, and user feedback for API failures
37. **Visual polish** - Responsive design, animations, and final styling adjustments

## Code Style Principles

### MVP Development Guidelines

#### 1. Modern React 19 + TypeScript Patterns
```typescript
// Component with proper TypeScript and React 19 patterns
interface TaskCardProps {
  task: TaskSchema
  onRetry: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, onRetry, onDelete }: TaskCardProps) {
  const { mutate: retryTask } = useRetryTask()
  
  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>{task.url}</CardTitle>
        <Badge variant={task.status === 'failed' ? 'destructive' : 'default'}>
          {task.status}
        </Badge>
      </CardHeader>
    </Card>
  )
}
```

#### 2. TanStack Query Integration
```typescript
// Custom hooks with TanStack Query
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => api.getTasks(projectId),
    refetchInterval: 2000, // Real-time polling for MVP
  })
}

// Mutations with optimistic updates
export function useRetryTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.retryTask,
    onMutate: async (taskId) => {
      // Optimistic update using React 19 patterns
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      // Update cache optimistically
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })
}
```

#### 3. Component Organization
```typescript
// Self-contained component structure
// components/tasks/task-card.tsx
export function TaskCard() {
  // Component logic here
}

// components/tasks/index.ts
export { TaskCard } from './task-card'
export { TaskKanban } from './task-kanban'
export { TaskModal } from './task-modal'
```

#### 4. Zustand Store Pattern
```typescript
// lib/store.ts - Client state only
interface DashboardStore {
  currentProjectId: string | null
  sidebarCollapsed: boolean
  setCurrentProject: (id: string) => void
  toggleSidebar: () => void
}

export const useStore = create<DashboardStore>((set) => ({
  currentProjectId: null,
  sidebarCollapsed: false,
  setCurrentProject: (id) => set({ currentProjectId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
}))
```

#### 5. Error Handling & Loading States
```typescript
// Fail fast with proper error boundaries
export function TaskKanban() {
  const { data: tasks, error, isLoading } = useTasks(projectId)
  
  if (error) throw error  // Let error boundary handle
  if (isLoading) return <TaskKanbanSkeleton />
  
  return <div>{/* Render tasks */}</div>
}

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={({ error, resetErrorBoundary }) => (
        <Alert variant="destructive">
          <AlertTitle>出错了</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <Button onClick={resetErrorBoundary}>重试</Button>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundaryComponent>
  )
}
```

#### 6. API Client Structure
```typescript
// lib/api.ts - Centralized API calls
const API_BASE = 'http://localhost:8000'

export const api = {
  // Project management
  getProjects: (): Promise<ProjectSchema[]> => 
    fetch(`${API_BASE}/projects`).then(res => res.json()),
  
  createProject: (name: string): Promise<ProjectSchema> =>
    fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(res => res.json()),
  
  // Task management
  getTasks: (projectId: string, status?: string): Promise<TaskResponse[]> => {
    const url = new URL(`${API_BASE}/tasks/${projectId}`)
    if (status) url.searchParams.set('status', status)
    return fetch(url.toString()).then(res => res.json())
  },
}
```

#### 7. Styling Conventions
```typescript
// Use Tailwind + shadcn/ui consistently
export function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <Card className="p-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Badge variant={trend === 'up' ? 'default' : 'secondary'}>
          {trend === 'up' ? '↗' : '↘'}
        </Badge>
      </CardContent>
    </Card>
  )
}
```

#### 8. File Naming & Structure
```typescript
// Consistent naming patterns
components/
├── ui/                    # shadcn/ui components (kebab-case)
│   ├── button.tsx
│   └── card.tsx
├── layout/                # Feature components (kebab-case)
│   ├── header.tsx
│   └── main-area.tsx
└── tasks/
    ├── task-card.tsx      # Component files
    ├── task-modal.tsx
    └── index.ts           # Barrel exports

hooks/
├── use-projects.ts        # Hook files (kebab-case)
└── use-tasks.ts

lib/
├── api.ts                 # Utility files (kebab-case)
├── types.ts
└── utils.ts
```

### Key Development Principles
- **No comments**: Self-documenting code through clear naming
- **Fail fast**: Throw errors immediately, let boundaries handle
- **Type everything**: Full TypeScript coverage
- **Single responsibility**: Each component/hook has one clear purpose
- **Consistent patterns**: Use same patterns across all components

## Key Implementation Features

### Production-Ready Architecture
- **Type Safety**: 100% TypeScript coverage with strict mode
- **Error Handling**: Comprehensive error boundaries with graceful failure recovery
- **State Management**: TanStack Query for server state + Zustand for client state
- **Real-time Updates**: Polling with configurable intervals for live dashboard data
- **Optimistic Updates**: Immediate UI feedback using React 19 patterns

### Modern Stack Integration
- **Next.js 15**: App Router with React 19 and Server Components
- **shadcn/ui**: New-york style with Tailwind v4 and CSS variables
- **TanStack Query**: Advanced caching, background updates, and optimistic mutations
- **Zustand**: Minimal client state management with selective subscriptions
- **TypeScript**: Full type safety with modern React 19 patterns

### Development Workflow
1. **Start server**: Backend running on `http://localhost:8000`
2. **Start frontend**: `npm run dev` with Next.js 15 + Turbopack
3. **Component development**: Build components in isolation with mock data
4. **API integration**: Connect components to real backend endpoints
5. **Real-time polling**: Implement live updates with TanStack Query
6. **Testing**: Manual testing with browser dev tools and React Query DevTools

## Dependencies

### Core Dependencies (Auto-resolved latest versions)
```bash
# Project initialization
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# shadcn/ui setup
npx shadcn@latest init  # Select: new-york style, neutral color, CSS variables

# Additional dependencies
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install react-markdown
npm install echarts echarts-for-react
npm install react-use-websocket
npm install lucide-react
npm install @radix-ui/react-slot
npm install class-variance-authority clsx tailwind-merge
```

### Key Package Features
- **Next.js 15**: App Router, React 19, Turbopack for development
- **shadcn/ui**: Accessible components with Tailwind integration
- **TanStack Query**: Server state management with caching and real-time updates
- **Zustand**: Lightweight client state management
- **react-markdown**: Markdown rendering for extracted content
- **echarts-for-react**: Interactive charts for dashboard statistics

**Status: Ready for Implementation** 🚀

This plan provides a complete roadmap for building a modern, production-ready frontend that integrates seamlessly with the existing backend implementation.