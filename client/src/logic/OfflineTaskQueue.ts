import { createTask, deleteTask, updateTask } from "../api/tasks";
import type { TaskCreate, TaskRead } from "../types/task";

export const TaskAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export type TaskAction = (typeof TaskAction)[keyof typeof TaskAction];

export type Job =
  | { type: typeof TaskAction.CREATE; payload: TaskRead }
  | { type: typeof TaskAction.UPDATE; payload: TaskRead }
  | { type: typeof TaskAction.DELETE; payload: { id: number } };

export function upsertUpdateJob(
  queue: Job[],
  id: number,
  baseTask: TaskRead,
  patch: Partial<TaskCreate>,
): Job[] {
  const queueIndex = queue.findIndex(
    (j): boolean =>
      (j.type === TaskAction.UPDATE || j.type === TaskAction.CREATE) && j.payload.id === id,
  );

  if (queueIndex === -1) {
    return [...queue, { type: TaskAction.UPDATE, payload: { ...baseTask, ...patch } }];
  }

  return queue.map((j, i) =>
    i === queueIndex && (j.type === TaskAction.CREATE || j.type === TaskAction.UPDATE)
      ? { ...j, payload: { ...j.payload, ...patch } }
      : j,
  );
}

export function upsertDeleteJob(queue: Job[], id: number): Job[] {
  const jobPosition = queue.findIndex((job) => job.payload.id === id);

  if (jobPosition === -1) {
    return [...queue, { type: TaskAction.DELETE, payload: { id } }];
  }

  const job = queue[jobPosition];

  switch (job.type) {
    case TaskAction.CREATE:
      return queue.filter((j) => j.payload.id !== id);
    case TaskAction.UPDATE:
      return queue.map((j) =>
        j.payload.id === id ? { type: TaskAction.DELETE, payload: { id } } : j,
      );
    case TaskAction.DELETE:
      return queue;
    default:
      console.warn(`Invalid job type, valid types: ${JSON.stringify(TaskAction)}`);
      return queue;
  }
}

export async function runOfflineQueue(queue: Job[]): Promise<Set<number>> {
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

  return completedIds;
}
