export type SerializedJob = {
  key: string;
  entityId: number;
  type: "CREATE" | "UPDATE" | "DELETE";
  payload: unknown;
};

export type Job = {
  entityId: number;
  type: "CREATE" | "UPDATE" | "DELETE";
  execute: () => Promise<void>;
  toJSON: () => SerializedJob;
};

export const jobRegistry: Record<string, (serialized: SerializedJob) => Job> = {};

export function upsertUpdate(queue: Job[], entityId: number, newJob: Job): Job[] {
  const idx = queue.findIndex(
    (j) => j.entityId === entityId && (j.type === "UPDATE" || j.type === "CREATE"),
  );
  if (idx === -1) return [...queue, newJob];
  return queue.map((j, i) => (i === idx ? newJob : j));
}

export function upsertDelete(queue: Job[], entityId: number, deleteJob: Job): Job[] {
  const idx = queue.findIndex((j) => j.entityId === entityId);
  if (idx === -1) return [...queue, deleteJob];
  const job = queue[idx];
  switch (job.type) {
    case "CREATE":
      return queue.filter((j) => j.entityId !== entityId);
    case "UPDATE":
      return queue.map((j, i) => (i === idx ? deleteJob : j));
    case "DELETE":
      return queue;
  }
}

export async function runQueue(queue: Job[]): Promise<Job[]> {
  const completed: Job[] = [];
  for (const job of queue) {
    try {
      await job.execute();
      completed.push(job);
    } catch {
      console.warn("Failed queued job:", job.toJSON());
    }
  }
  return completed;
}

export function deserializeQueue(serialized: SerializedJob[]): Job[] {
  return serialized
    .map((s) => jobRegistry[s.key]?.(s))
    .filter((j): j is Job => !!j);
}
