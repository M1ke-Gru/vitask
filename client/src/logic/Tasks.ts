import { create } from "zustand";
import { persist } from "zustand/middleware";
import { changeDone, changeName, createTask, deleteTask, listTasks } from "../api/tasks";
import type { TaskCreate, TaskRead } from "../types/task";
import useRequestQueue from "./RequestQueue";
import useCategories from "./Categories";

function sortTasks(ts: TaskRead[]) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return aDone - bDone || a.name.localeCompare(b.name);
  });
}

type TaskListData = {
  tasks: TaskRead[];
  showDone: boolean;
  draft: string;
  loading: boolean;
  error: string | null;
};

// Reset useTasks data to this when logging out
// or set to it for a new user
const initialTaskListData: TaskListData = {
  tasks: [],
  showDone: true,
  draft: "",
  loading: false,
  error: null,
};

type TaskListState = TaskListData & {
  setDraft: (draft: string) => void;
  clearFinished: () => Promise<void>;
  clearCategoryFinished: (categoryId: number) => Promise<void>;
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
      return get().tasks.filter(condition).map((t) => t.id);
    }

    // Helps to optimistically update tasks
    async function updateHelper(
      func: (id: number, task_part: Partial<TaskCreate>) => Promise<void | TaskRead>,
      id: number,
      args: Partial<TaskCreate>,
    ) {
      const task = get().tasks.find((task) => task.id === id);
      if (!task) {
        console.warn("Non-existing task updated.");
        return;
      }
      // Optimistic local update
      set((state) => ({
        tasks: sortTasks(state.tasks.map((t) => (t.id === id ? { ...t, ...args } : t))),
      }));

      if (id < 0) return; // temp task, skip API call
      try {
        await func(id, args);
      } catch {
        useRequestQueue.getState().queueTaskUpdate({ ...task, ...args } as TaskRead);
      }
    }

    async function deleteHelper(condition: (task: TaskRead) => boolean) {
      const ids: Set<number> = new Set(getTaskIdsBy(condition));

      set((state) => ({
        tasks: state.tasks.filter((t) => !ids.has(t.id)),
      }));

      for (const id of ids) {
        if (id < 0) continue; // temp task never reached server, skip API call
        try {
          await deleteTask(id);
        } catch {
          useRequestQueue.getState().queueTaskDelete(id);
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
          set({ tasks: [], loading: false });
          throw e;
        }
      },

      setDraft: (draft: string) => set({ draft }),

      toggleTaskDone: async (id: number) => {
        const task = get().tasks.find((task) => id === task.id);
        if (!task) {
          console.warn(`Task with id ${id} does not exist`);
          return;
        }
        await updateHelper(changeDone, id, { isDone: !task.isDone });
      },

      changeTaskName: (id: number, name: string) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, name } : t)),
        }));
      },

      sendNewTaskName: async (id: number, name: string) => {
        await updateHelper(changeName, id, { name });
      },

      toggleShowDone: () => {
        set((s) => ({ showDone: !s.showDone }));
      },

      addTask: async () => {
        const name = get().draft.trim();
        if (!name) return;

        const { selectedCategoryId, categories } = useCategories.getState();
        const validCategoryId = categories.some(c => c.id === selectedCategoryId) ? selectedCategoryId : null;
        const tempId = -Date.now();
        const optimisticTask: TaskRead = {
          id: tempId,
          name,
          isDone: false,
          categoryId: validCategoryId ?? 0,
        };

        set((state) => ({
          tasks: sortTasks([...state.tasks, optimisticTask]),
          draft: "",
          error: null,
        }));

        try {
          const created = await createTask({
            name,
            isDone: false,
            ...(validCategoryId !== null && validCategoryId > 0
              ? { categoryId: validCategoryId }
              : {}),
          });
          set((state) => ({
            tasks: sortTasks(state.tasks.map((t) => (t.id === tempId ? created : t))),
          }));
        } catch (e) {
          useRequestQueue.getState().queueTaskCreate(optimisticTask);
          set({ error: e instanceof Error ? e.message : "Offline: queued task creation" });
        }
      },

      clearFinished: async () => {
        await deleteHelper((task) => task.isDone);
      },

      clearCategoryFinished: async (categoryId: number) => {
        await deleteHelper((task) => task.isDone && task.categoryId === categoryId);
      },

      onReconnect: async () => {
        const completed = await useRequestQueue.getState().run();
        if (completed.length > 0) {
          try {
            const updated = await get().fetchTasks();
            set({ tasks: sortTasks(updated) });
          } catch (e) {
            console.warn("Could not refetch tasks after reconnecting", e);
          }
        }
      },

      resetOnLogout: () => set({ ...initialTaskListData }),
    });
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
export default useTasks;
