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

export const TaskAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type TaskAction = (typeof TaskAction)[keyof typeof TaskAction];

/** Keep the queue minimal: store payload + tempId, not whole TaskRead */
type Job =
  | { type: typeof TaskAction.CREATE; payload: TaskRead }
  | { type: typeof TaskAction.UPDATE; payload: TaskRead }
  | { type: typeof TaskAction.DELETE; payload: { id: number } }

// Exists to keep initial attributes in sync with the store
type TaskListData = {
  tasks: TaskRead[];
  offlineTaskQueue: Job[];
  showDone: boolean;
  draft: string;
  loading: boolean;
  error: string | null;
};

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

        const tempId = -Date.now(); // negative -> clearly client-generated
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

        const completedTempIds = new Set<number>();

        for (const job of queue) {
          try {
            switch (job.type) {
              case TaskAction.CREATE:
                await createTask(job.payload)
                break
              case TaskAction.UPDATE:
                await updateTask(job.payload)
                break
              case TaskAction.DELETE:
                await deleteTask(job.payload.id)
                break
            }
            completedTempIds.add(job.payload.id)
          } catch {
            break;
          }
        }

        // Remove completed jobs from queue
        if (completedTempIds.size > 0) {
          set((state) => ({
            offlineTaskQueue: state.offlineTaskQueue.filter(
              (j) => !(completedTempIds.has(j.payload.id))
            ),
          }));
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
      set((state) => ({
        tasks: sortTasks(
          state.tasks.map((t) => (t.id === id ? { ...t, ...args } : t))
        ),
      }));

      try {
        await func(id, args);
      } catch {
        /*
         * Id was optimistically set if it is less than zero,
         * which means that the task is in the offline queue
         * waiting to be created on the backend.
         * Therefore the parameters which the newly created 
         * task has need to simply be updated in the offline queue
        */
        if (id < 0 || get().offlineTaskQueue.find((task) => task.payload.id === id)) {
          set((state) => ({
            offlineTaskQueue: state.offlineTaskQueue.map((j) =>
              j.payload.id === id
                ? { ...j, args: { ...j.payload, ...args } }
                : j
            ),
          }));
        } else {

          const task = get().tasks.find((task) => task.id === id)!
          set((state) => ({
            offlineTaskQueue: [
              ...state.offlineTaskQueue,
              { type: TaskAction.UPDATE, payload: task },
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
            if (otask.type === TaskAction.CREATE) {
              taskState.offlineTaskQueue.filter((job) => job.payload.id !== id)
            } else if (otask.type === TaskAction.UPDATE) {
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
