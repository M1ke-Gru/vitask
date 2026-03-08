import { create } from "zustand";

import {
  runQueue,
  upsertUpdate,
  upsertDelete,
  deserializeQueue,
  jobRegistry,
  type Job,
  type SerializedJob,
} from "./OfflineQueue";
import { createTask, deleteTask, updateTask } from "../api/tasks";
import { createCategory, deleteCategory, renameCategory } from "../api/categories";
import type { TaskRead } from "../types/task";
import type { CategoryRead } from "../types/category";

// --- Task job factories ---

function makeTaskCreateJob(task: TaskRead): Job {
  return {
    entityId: task.id,
    type: "CREATE",
    execute: async () => {
      await createTask({ name: task.name, isDone: task.isDone, categoryId: task.categoryId });
    },
    toJSON: () => ({ key: "task.create", entityId: task.id, type: "CREATE", payload: task }),
  };
}

function makeTaskUpdateJob(task: TaskRead): Job {
  return {
    entityId: task.id,
    type: "UPDATE",
    execute: async () => { await updateTask(task); },
    toJSON: () => ({ key: "task.update", entityId: task.id, type: "UPDATE", payload: task }),
  };
}

function makeTaskDeleteJob(id: number): Job {
  return {
    entityId: id,
    type: "DELETE",
    execute: async () => { await deleteTask(id); },
    toJSON: () => ({ key: "task.delete", entityId: id, type: "DELETE", payload: { id } }),
  };
}

// --- Category job factories ---

function makeCategoryCreateJob(category: CategoryRead): Job {
  return {
    entityId: category.id,
    type: "CREATE",
    execute: async () => { await createCategory({ name: category.name }); },
    toJSON: () => ({
      key: "category.create",
      entityId: category.id,
      type: "CREATE",
      payload: category,
    }),
  };
}

function makeCategoryRenameJob(category: CategoryRead): Job {
  return {
    entityId: category.id,
    type: "UPDATE",
    execute: async () => { await renameCategory(category.id, category.name); },
    toJSON: () => ({
      key: "category.rename",
      entityId: category.id,
      type: "UPDATE",
      payload: category,
    }),
  };
}

function makeCategoryDeleteJob(id: number): Job {
  return {
    entityId: id,
    type: "DELETE",
    execute: async () => { await deleteCategory(id); },
    toJSON: () => ({ key: "category.delete", entityId: id, type: "DELETE", payload: { id } }),
  };
}

// Register factories for deserialization on hydration
jobRegistry["task.create"] = (s) => makeTaskCreateJob(s.payload as TaskRead);
jobRegistry["task.update"] = (s) => makeTaskUpdateJob(s.payload as TaskRead);
jobRegistry["task.delete"] = (s) => makeTaskDeleteJob(s.entityId);
jobRegistry["category.create"] = (s) => makeCategoryCreateJob(s.payload as CategoryRead);
jobRegistry["category.rename"] = (s) => makeCategoryRenameJob(s.payload as CategoryRead);
jobRegistry["category.delete"] = (s) => makeCategoryDeleteJob(s.entityId);

// --- Persistence (manual, since Job contains functions that can't go through JSON.stringify) ---

const STORAGE_KEY = "request-queue";

function persistQueue(queue: Job[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.map((j) => j.toJSON())));
  } catch {
    console.warn("Could not persist request queue");
  }
}

function hydrateQueue(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return deserializeQueue(JSON.parse(raw) as SerializedJob[]);
  } catch {
    return [];
  }
}

// --- Store ---

type RequestQueueState = {
  queue: Job[];
  queueTaskCreate: (task: TaskRead) => void;
  queueTaskUpdate: (task: TaskRead) => void;
  queueTaskDelete: (id: number) => void;
  queueCategoryCreate: (category: CategoryRead) => void;
  queueCategoryRename: (category: CategoryRead) => void;
  queueCategoryDelete: (id: number) => void;
  remapTaskCategory: (fromId: number, toId: number) => void;
  run: () => Promise<Job[]>;
  reset: () => void;
};

const useRequestQueue = create<RequestQueueState>()((set, get) => {
  function mutateQueue(updater: (q: Job[]) => Job[]): void {
    set((s) => {
      const queue = updater(s.queue);
      persistQueue(queue);
      return { queue };
    });
  }

  return {
    queue: hydrateQueue(),

    queueTaskCreate: (task) => mutateQueue((q) => [...q, makeTaskCreateJob(task)]),
    queueTaskUpdate: (task) =>
      mutateQueue((q) => upsertUpdate(q, task.id, makeTaskUpdateJob(task))),
    queueTaskDelete: (id) =>
      mutateQueue((q) => upsertDelete(q, id, makeTaskDeleteJob(id))),

    queueCategoryCreate: (category) =>
      mutateQueue((q) => [...q, makeCategoryCreateJob(category)]),
    queueCategoryRename: (category) =>
      mutateQueue((q) => upsertUpdate(q, category.id, makeCategoryRenameJob(category))),
    queueCategoryDelete: (id) =>
      mutateQueue((q) => upsertDelete(q, id, makeCategoryDeleteJob(id))),

    remapTaskCategory: (fromId, toId) => {
      mutateQueue((q) =>
        q.map((job) => {
          if (
            (job.type === "CREATE" || job.type === "UPDATE") &&
            "categoryId" in job.toJSON().payload &&
            (job.toJSON().payload as { categoryId: number }).categoryId === fromId
          ) {
            const serialized = job.toJSON();
            const updated = { ...(serialized.payload as { categoryId: number }), categoryId: toId };
            if (serialized.key === "task.create") return makeTaskCreateJob(updated as TaskRead);
            if (serialized.key === "task.update") return makeTaskUpdateJob(updated as TaskRead);
          }
          return job;
        })
      );
    },

    run: async () => {
      const snapshot = [...get().queue];
      if (snapshot.length === 0) return [];
      const completed = await runQueue(snapshot);
      const completedSet = new Set(completed);
      mutateQueue((q) => q.filter((j) => !completedSet.has(j)));
      return completed;
    },

    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ queue: [] });
    },
  };
});

export default useRequestQueue;
