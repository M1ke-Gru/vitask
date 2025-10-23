import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listTasks, createTask, changeDone, updateTask, deleteTask, changeName } from "../api/tasks";
import type { TaskCreate, TaskRead } from "../types/task";

function sortTasks(ts: TaskRead[]) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return aDone - bDone || a.name.localeCompare(b.name);
  });
}

export const TaskAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type TaskAction = (typeof TaskAction)[keyof typeof TaskAction];

type Job =
  | { type: typeof TaskAction.CREATE; payload: TaskRead }
  | { type: typeof TaskAction.UPDATE; payload: TaskRead }
  | { type: typeof TaskAction.DELETE; payload: { id: number } }

type TaskListData = {
  tasks: TaskRead[];
  offlineTaskQueue: Job[];
  showDone: boolean;
  draft: string;
  loading: boolean;
  error: string | null;
};

// Reset useTasks data to this when logging out 
// or set to it for a new user
const initialTaskListData: TaskListData = {
  tasks: [],
  offlineTaskQueue: [],
  showDone: true,
  draft: "",
  loading: false,
  error: null,
};

type TaskListState = TaskListData & {
  setDraft: (draft: string) => void;
  clearFinished: () => void;
  fetchTasks: () => Promise<TaskRead[]>;
  toggleShowDone: () => void;

  addTask: () => Promise<void>;
  changeTaskName: (id: number, name: string) => void;
  sendNewTaskName: (id: number, name: string) => void;
  toggleTaskDone: (id: number) => void;

  onReconnect: () => Promise<void>;
  resetOnLogout: () => void;
};

export const useTasks = create<TaskListState>()(
  persist((set, get) => {
    const store = ({
      ...initialTaskListData,

      fetchTasks: async (): Promise<TaskRead[]> => {
        try {
          set({ loading: true, error: null });
          const data = await listTasks();
          const sorted = sortTasks(data);
          set({ tasks: sorted, loading: false });
          return sorted;
        } catch (e: any) {
          set({
            tasks: [], loading: false
          });
          return [];
        }
      },

      setDraft: (draft: string) => set({ draft }),

      toggleTaskDone: (id: number) => {
        const task = get().tasks.find(task => id === task.id)!
        updateHelper(changeDone, id, { isDone: !task.isDone })
      },

      changeTaskName: (id: number, name: string) => {
        set((state) => ({
          tasks:
            state.tasks.map((t) => (t.id === id ? { ...t, name: name } : t))
        }));
      },

      sendNewTaskName: (id: number, name: string) => {
        updateHelper(changeName, id, { name })
      },

      toggleShowDone: () => {
        set((s) => ({ showDone: !s.showDone }))
      },

      addTask: async () => {
        const name = get().draft.trim();
        if (!name) return;

        const tempId = -Date.now(); // negative -> client-generated
        const optimistic: TaskCreate = { name, isDone: false };

        set((state) => ({
          tasks: sortTasks([...state.tasks, { ...optimistic, id: tempId }]),
          draft: "",
          error: null,
        }));

        try {
          const created = await createTask({ name, isDone: false });

          set((state) => ({
            tasks: sortTasks(
              state.tasks.map((t) => (t.id === tempId ? created : t))
            ),
          }));
        } catch (e) {
          set((state) => ({
            offlineTaskQueue: [
              ...state.offlineTaskQueue,
              { type: TaskAction.CREATE, payload: { ...optimistic, id: tempId } },
            ],
            error:
              e instanceof Error ? e.message : "Offline: queued task creation",
          }));
        }
      },

      clearFinished: () => {
        deleteHelper((task) => task.isDone)
      },

      onReconnect: async () => {
        const queue = [...get().offlineTaskQueue];
        if (queue.length === 0) return;

        const completedIds = new Set<number>();

        for (const job of queue) {
          try {
            switch (job.type) {
              case TaskAction.CREATE:
                await createTask(job.payload);
                break;
              case TaskAction.UPDATE:
                await updateTask(job.payload);
                break;
              case TaskAction.DELETE:
                await deleteTask(job.payload.id);
                break;
            }
            completedIds.add(job.payload.id);
          } catch {
            console.warn("Failed job:", job);
          }
        }

        if (completedIds.size > 0) {
          set((state) => ({
            offlineTaskQueue: state.offlineTaskQueue.filter(
              (j) => !completedIds.has(j.payload.id)
            ),
          }));

          // Refetch tasks to ensure sync with backend
          try {
            const updated = await get().fetchTasks();
            set({ tasks: sortTasks(updated) });
          } catch (e) {
            console.warn("Could not refetch tasks after reconnecting", e);
          }
        }
      },

      resetOnLogout: () => set({ ...initialTaskListData }),
    })

    // Helps to optimistically update tasks
    async function updateHelper(
      func: (id: number, task_part: Partial<TaskCreate>) => Promise<void | TaskRead>,
      id: number,
      args: Partial<TaskCreate>,
    ) {
      // Optimistic local update
      set((state) => ({
        tasks: sortTasks(
          state.tasks.map((t) => (t.id === id ? { ...t, ...args } : t))
        ),
      }));

      try {
        await func(id, args);
      } catch {
        const queue = get().offlineTaskQueue;

        // Find if there are pending create or update jobs to include the update into these
        const existingIndex = queue.findIndex(
          (j) => j.type === TaskAction.UPDATE || TaskAction.CREATE && j.payload.id === id
        );
        if (existingIndex !== -1) {
          set((state) => ({
            offlineTaskQueue: state.offlineTaskQueue.map((j, i) =>
              i === existingIndex
                ? { ...j, payload: { ...j.payload, ...args } }
                : j
            ),
          }));
        } else {
          // Create update job
          const task = get().tasks.find((task) => task.id === id)!;
          set((state) => ({
            offlineTaskQueue: [
              ...state.offlineTaskQueue,
              { type: TaskAction.UPDATE, payload: { ...task, ...args } },
            ],
          }));
        }
      }
    }
    async function deleteHelper(
      condition: (task: TaskRead) => boolean,
    ) {
      const taskState = get()
      const tasksToDelete = taskState.tasks.filter(condition)
      const ids = tasksToDelete.map(t => t.id)
      set((state) => ({
        tasks: state.tasks.filter(t => !condition(t)),
      }));

      for (const id of ids) {
        try {
          await deleteTask(id);
        } catch {
          const otaskPosition = taskState.offlineTaskQueue.findIndex(job => job.payload.id === id)
          if (otaskPosition !== -1) {
            const otask = taskState.offlineTaskQueue[otaskPosition]
            // If there is a pending create job, simply delete the job
            if (otask.type === TaskAction.CREATE) {
              set((state) => ({
                offlineTaskQueue: state.offlineTaskQueue.filter(
                  (job) => job.payload.id !== id)
              }))
            } else if (otask.type === TaskAction.UPDATE) {
              // Pending update job -> replace it with a delete job
              set((state) => ({
                offlineTaskQueue: state.offlineTaskQueue.map(
                  (job) => (job.payload.id === id ? { type: TaskAction.DELETE, payload: { id } } : job)
                )
              }))
            } else if (otask.type === TaskAction.DELETE) {
              continue
            }
          } else {
            set((state) => ({
              offlineTaskQueue: [...state.offlineTaskQueue,
              { type: TaskAction.DELETE, payload: { id } }]
            }))
          }
        }
      }
      set((state) => ({
        tasks: sortTasks(state.tasks),
      }));

    }
    return store
  },
    {
      name: "tasks",
      partialize: (s) => ({
        tasks: s.tasks,
        showDone: s.showDone,
        draft: s.draft,
      }),
      version: 1,
    }
  )
);
