import { create } from "zustand";
import { persist } from "zustand/middleware";
import { listTasks, createTask, changeDone, updateTask, deleteTask, changeName } from "../api/tasks";
import type { TaskCreate, TaskRead } from "../types/task";
import { useAuth } from "./Auth";

function sortTasks(ts: TaskRead[]) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return aDone - bDone || a.name.localeCompare(b.name);
  });
}

/** Keep the queue minimal: store payload + tempId, not whole TaskRead */
type Job = {
  id: number;
  action: (...args) => Promise<void | TaskRead>
  args: Partial<TaskCreate>
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
        const task = get().tasks.find(task => id === task.id)
        if (!task) throw Error("No task with id " + id + " coud be found.")
        const reverse_done = !task.isDone
        updateHelper(changeDone, id, { isDone: reverse_done })
      },

      changeTaskName: (id: number, name: string) => {
        updateHelper(changeName, id, { name: name })
      },

      toggleShowDone: () => {
        set((s) => ({ showDone: !s.showDone }))
      },

      addTask: async () => {
        const name = get().draft.trim();
        if (!name) return;

        const tempId = -Date.now(); // negative -> clearly client-generated
        const optimistic: TaskCreate = { name, isDone: false };

        // 1) optimistic insert
        set((state) => ({
          tasks: sortTasks([...state.tasks, { id: tempId, ...optimistic }]),
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
              { id: tempId, action: createTask, args: optimistic },
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
            job.action(job.args)
          } catch {
            // Breaks if offline again
            break;
          }
        }

        // Remove completed jobs from queue
        if (completedTempIds.size > 0) {
          set((state) => ({
            offline_task_queue: state.offline_task_queue.filter(
              (j) => !(completedTempIds.has(j.id))
            ),
          }));
        }
      },

      resetOnLogout: () => set({ ...initialTaskListData }),
    })

    // Helps to optimistically update tasks
    async function updateHelper(
      action: (id: number, ...attrs: any[]) => Promise<any>,
      id: number,
      args: Partial<TaskCreate> // what specifically to update in the task
    ) {
      set((state) => ({
        tasks: sortTasks(
          state.tasks.map((t) => (t.id === id ? { ...t, ...args } : t))
        ),
      }));

      try {
        await action(id, args);
      } catch {
        /*
         * Id was optimistically set if it is less than zero,
         * which means that the task is in the offline queue
         * waiting to be created on the backend.
         * Therefore the parameters which the newly created 
         * task has need to simply be updated in the offline queue
        */
        if (id < 0) {
          set((state) => ({
            offline_task_queue: state.offline_task_queue.map((j) =>
              j.id === id
                ? { ...j, args: { ...j.args, ...args } }
                : j
            ),
          }));
        } else {
          set((state) => ({
            offline_task_queue: [
              ...state.offline_task_queue,
              { id, action, args },
            ],
          }));
        }
      }
    }
    return store
  },
    {
      name: "tasks",
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


