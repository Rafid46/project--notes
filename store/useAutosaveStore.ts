import { create } from "zustand";

export interface SaveSnapshot {
  title: string;
  content: string;
  revision: number;
  labelId?: string | null;
  category?: string | null;
}

export interface SaveTask {
  id: string; // The frontend ID
  serverId?: string; // The actual server ID once created
  isCreating: boolean;
  isRequestInFlight: boolean;
  latestSnapshot: SaveSnapshot;
  pendingSnapshot: SaveSnapshot | null;
  lastSaveAttempt: number;
  retryCount: number;
  parentId?: string | null;
}

interface AutosaveState {
  tasks: Record<string, SaveTask>;
  setTask: (id: string, task: SaveTask) => void;
  updateTask: (id: string, updates: Partial<SaveTask>) => void;
  removeTask: (id: string) => void;
}

export const useAutosaveStore = create<AutosaveState>((set) => ({
  tasks: {},
  setTask: (id, task) =>
    set((state) => ({ tasks: { ...state.tasks, [id]: task } })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], ...updates },
      },
    })),
  removeTask: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.tasks;
      return { tasks: rest };
    }),
}));
