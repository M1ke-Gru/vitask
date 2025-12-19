import { create } from "zustand";
import { persist } from "zustand/middleware";
import { changeDone, changeName, createTask, deleteTask, listTasks, updateTask } from "../api/tasks";
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
  clearFinished: () => Promise<void>;
  fetchTasks: () => Promise<TaskRead[]>;
  toggleShowDone: () => void;

  addTask: () => Promise<void>;
  changeTaskName: (id: number, name: string) => void;
  sendNewTaskName: (id: number, name: string) => Promise<void>;
  toggleTaskDone: (id: number) => Promise<void>;

  onReconnect: () => Promise<void>;
  resetOnLogout: () => void;
};

const useTasks = create<TaskListState>()(
  persist((set, get) => {
    function getTaskIdsBy(condition: (task: TaskRead) => boolean): number[] {
      const taskState = get()
      const tasks = taskState.tasks.filter(condition)
      return tasks.map(t => t.id)
    }

    // Helps to optimistically update tasks
    async function updateHelper(
      func: (id: number, task_part: Partial<TaskCreate>) => Promise<void | TaskRead>,
      id: number,
      args: Partial<TaskCreate>,
    ) {
      const task = get().tasks.find((task) => task.id === id);
      if (!task) {
        console.warn("Non-existing task updated.")
        return
      }
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

        // Find if there are pending create or update jobs to include the update into these.
        const queueIndex: number = queue.findIndex(
          (j: Job): boolean => (j.type === TaskAction.UPDATE || j.type === TaskAction.CREATE) && j.payload.id === id
        );

        if (queueIndex === -1) {
          set((state) => ({
            offlineTaskQueue: [
              ...state.offlineTaskQueue,
              { type: TaskAction.UPDATE, payload: { ...task, ...args } },
            ],
          }));
          return
        }

        set((state: TaskListState) => ({
          offlineTaskQueue: state.offlineTaskQueue.map((j: Job, i: number) => {
            return i === queueIndex && (j.type === TaskAction.CREATE || j.type === TaskAction.UPDATE)
              ? { ...j, payload: { ...j.payload, ...args } }
              : j;
          }
          ),
        }));
      }
    }

    async function deleteHelper(
      condition: (task: TaskRead) => boolean,
    ) {
      const ids: Set<number> = new Set(getTaskIdsBy(condition));

      set((state) => ({
        tasks: state.tasks.filter(t => !ids.has(t.id)),
      }));

      for (const id of ids) {
        try {
          await deleteTask(id);
        } catch {
          const otaskPosition = get().offlineTaskQueue.findIndex(job => job.payload.id === id)

          // Runs when a task is not in the job queue
          if (otaskPosition === -1) {
            set((state) => ({
              offlineTaskQueue: [...state.offlineTaskQueue,
              { type: TaskAction.DELETE, payload: { id } }]
            }))
            continue
          }

          const otask: Job = get().offlineTaskQueue[otaskPosition]

          // There is a job for the task in the queue
          switch (otask.type) {
            case TaskAction.CREATE:
              set((state) => ({
                offlineTaskQueue: state.offlineTaskQueue.filter(
                  (job) => job.payload.id !== id)
              }))
              break;

            case TaskAction.UPDATE:
              set((state) => ({
                offlineTaskQueue: state.offlineTaskQueue.map(
                  (job) => (job.payload.id === id ? { type: TaskAction.DELETE, payload: { id } } : job)
                )
              }))
              break;

            case TaskAction.DELETE:
              continue;

            default:
              console.warn(`Invalid job type, valid types: ${TaskAction}`)
              break;
          }
        }
      }
      set((state) => ({
        tasks: sortTasks(state.tasks),
      }));

    }
    return ({
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
          throw e;
        }
      },

      setDraft: (draft: string) => set({ draft }),

      toggleTaskDone: async (id: number) => {
        const task = get().tasks.find(task => id === task.id)
        if (!task) {
          console.warn(`Task with id ${id} does not exist`)
          return
        }
        await updateHelper(changeDone, id, { isDone: !task.isDone })
      },

      changeTaskName: (id: number, name: string) => {
        set((state) => ({
          tasks:
            state.tasks.map((t) => (t.id === id ? { ...t, name: name } : t))
        }));
      },

      sendNewTaskName: async (id: number, name: string) => {
        await updateHelper(changeName, id, { name })
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

      clearFinished: async () => {
        await deleteHelper((task) => task.isDone)
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
export default useTasks
