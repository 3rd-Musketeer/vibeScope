import { create } from 'zustand'

interface DashboardStore {
  currentProjectId: string | null
  currentProjectToken: string | null
  setCurrentProject: (id: string, token: string) => void
}

export const useStore = create<DashboardStore>((set) => ({
  currentProjectId: null,
  currentProjectToken: null,
  setCurrentProject: (id, token) => set({ currentProjectId: id, currentProjectToken: token })
}))


interface QueryStore {
  relevantNoteIds: string[]
  setRelevantNoteIds: (ids: string[]) => void
  clearRelevantNoteIds: () => void
}

export const useQueryStore = create<QueryStore>((set) => ({
  relevantNoteIds: [],
  setRelevantNoteIds: (ids) => set({ relevantNoteIds: ids }),
  clearRelevantNoteIds: () => set({ relevantNoteIds: [] })
}))