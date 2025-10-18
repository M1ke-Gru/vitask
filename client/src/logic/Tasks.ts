import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listTasks, createTask, changeDone, updateTask, deleteTask } from "../api/tasks";
import type { TaskCreate, TaskRead } from "../types/task";

function sortTasks(ts: TaskRead[]) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return aDone - bDone || a.name.localeCompare(b.name);
  });
}

enum TaskAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
}

/** Keep the queue minimal: store payload + tempId, not whole TaskRead */
type Job = {
  action: TaskAction;
  id: number;
  payload: TaskRead;
};

// Exists to keep initial attributes in sync with the store
type TaskListData = {
  tasks: TaskRead[];
  offline_task_queue: Job[];
  showDone: boolean;
  draft: string;
  loading: boolean;
  error: string | null;
};

const initialTaskListData: TaskListData = {
  tasks: [],
  offline_task_queue: [],
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
  toggleTaskDone: (id: number) => void;

  onReconnect: () => Promise<void>;
  resetOnLogout: () => void;
};

export const useTasks = create<TaskListState>()(persist((set, get) => {
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
          error: e instanceof Error ? e.message : "Failed to load tasks",
          loading: false,
        });
        return [];
      }
    },

    setDraft: (draft: string) => set({ draft }),

    toggleTaskDone: (id: number) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, isDone: !t.isDone } : t
        ),
      }))
      const task: TaskRead | undefined = get().tasks.find(t => t.id == id)
      try {
        if (task) {
          changeDone(id, task.isDone)
        } else {
          const e: Error = Error("taskNotFound")
          throw e
        }
      } catch {
        if (task) set((state) => ({
          offline_task_queue: [
            ...state.offline_task_queue,
            { action: TaskAction.UPDATE, id: task.id, payload: { id: task.id, name: task.name, isDone: false } },
          ],
        }));
      }
    },

    changeTaskName: (id: number, name: string) =>
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, name } : t
        ),
      })),

    toggleShowDone: () => set((s) => ({ showDone: !s.showDone })),


    addTask: async () => {
      const name = get().draft.trim();
      if (!name) return;

      const tempId = -Date.now(); // negative -> clearly client-generated
      const optimistic: TaskRead = { id: tempId, name, isDone: false };

      // 1) optimistic insert
      set((state) => ({
        tasks: sortTasks([...state.tasks, optimistic]),
        draft: "",
        error: null,
      }));

      try {
        // 2) real request
        const created = await createTask({ name, isDone: false });

        // 3) reconcile temp -> server
        set((state) => ({
          tasks: sortTasks(
            state.tasks.map((t) => (t.id === tempId ? created : t))
          ),
        }));
      } catch (e) {
        // Queue for later; keep optimistic item visible
        set((state) => ({
          offline_task_queue: [
            ...state.offline_task_queue,
            { action: TaskAction.CREATE, id: tempId, payload: optimistic },
          ],
          error:
            e instanceof Error ? e.message : "Offline: queued task creation",
        }));
      }
    },

    clearFinished: () =>
      set((state) => ({
        tasks: state.tasks.filter((t) => !t.isDone),
      })),

    onReconnect: async () => {
      const queue = [...get().offline_task_queue];
      if (queue.length === 0) return;

      const completedTempIds = new Set<number>();

      for (const job of queue) {
        try {
          switch (job.action) {
            case TaskAction.CREATE.valueOf(): { // .valueOf is here, because lsp kept annoying me with it.
              const created = await createTask(job.payload);
              // replace optimistic id with server id
              set((state) => ({
                tasks: sortTasks(
                  state.tasks.map((t) => (t.id === job.id ? created : t))
                ),
              }));
              completedTempIds.add(job.id);

              break;
            }

            case TaskAction.UPDATE.valueOf(): {
              await updateTask(job.payload)
              completedTempIds.add(job.payload.id);
              break;
            }

            case TaskAction.DELETE.valueOf(): {
              await deleteTask(job.payload.id);
              set((state) => ({
                tasks: state.tasks.filter((t) => t.id !== job.payload.id),
              }));
              completedTempIds.add(job.payload.id);
              break;
            }

          }
        } catch {
          // Breaks if offline again
          break;
        }
      }

      // Remove completed jobs from queue
      if (completedTempIds.size > 0) {
        set((state) => ({
          offline_task_queue: state.offline_task_queue.filter(
            (j) => !(j.action === TaskAction.CREATE && completedTempIds.has(j.id))
          ),
        }));
      }
    },

    resetOnLogout: () => set({ ...initialTaskListData }),
  })

  // Helps to optimistically update tasks
  async function updateHelper(
    callback: (payload: TaskRead) => Promise<void> | void,
    optimistic: TaskRead
  ) {
    set((state) => ({
      tasks: sortTasks(
        state.tasks.map((t) => (t.id === optimistic.id ? { ...t, ...optimistic } : t))
      ),
    }));

    try {
      await callback(optimistic);
    } catch {
      // Id was optimistically set if it is less than zero
      if (optimistic.id < 0) {
        set((state) => ({
          offline_task_queue: state.offline_task_queue.map((j) =>
            j.action === TaskAction.CREATE && j.id === optimistic.id
              ? { ...j, payload: { ...j.payload, ...optimistic } }
              : j
          ),
        }));
      } else {
        set((state) => ({
          offline_task_queue: [
            ...state.offline_task_queue,
            { action: TaskAction.UPDATE, id: optimistic.id, payload: optimistic },
          ],
        }));
      }
    }
  }

  async function deleteHelper(
    callback: (payload: TaskRead) => Promise<void> | void,
    optimistic: TaskRead
  ) {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== optimistic.id),
    }));

    try {
      await callback(optimistic);
    } catch {
      if (optimistic.id < 0) {
        // Deleting a not-yet-synced task can be just done by dropping its create job from queue
        set((state) => ({
          offline_task_queue: state.offline_task_queue.filter(
            (j) => !(j.action === TaskAction.CREATE && j.id === optimistic.id)
          ),
        }));
      } else {
        set((state) => ({
          offline_task_queue: [
            ...state.offline_task_queue,
            { action: TaskAction.DELETE, id: optimistic.id, payload: optimistic },
          ],
        }));
      }
    }
  }
  return store
},
  {
    name: "tasks",
    // persist only the meaningful bits
    partialize: (s) => ({
      tasks: s.tasks,
      showDone: s.showDone,
      draft: s.draft,
      offline_task_queue: s.offline_task_queue,
    }),
    version: 1,
  }
)
);


