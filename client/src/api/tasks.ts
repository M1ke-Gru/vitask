import { TaskCreate, TaskRead } from "../types/task"
import api from "./auth"

export const action = {
  LOL: () => { console.log("lol") },
  HI: () => { console.log("hi") }
} as const;

export type action = (typeof action)[keyof typeof action];


export async function createTask(task: TaskCreate): Promise<TaskRead> {
  const { data } = await api.post<TaskRead>("/task/create", task)
  return data
}

export async function getTask(id: number): Promise<TaskRead> {
  const { data } = await api.get<TaskRead>("/task/" + id)
  return data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete("/task/delete/" + id)
}

export async function changeDone(id: number, task_part: { isDone: boolean }): Promise<void> {
  await api.patch(`/task/is_done/${id}/${task_part.isDone}`)
}

export async function changeName(id: number, task_part: { name: string }): Promise<void> {
  await api.patch(`/task/name/${id}/${task_part.name}`)
}

export async function listTasks(): Promise<TaskRead[]> {
  const { data } = await api.get<Array<TaskRead>>("/task/list")
  return data
}

export async function deleteAllDone(): Promise<void> {
  await api.delete("/task/done")
}

export async function updateTask(task: TaskRead) {
  await api.patch("/task/update", task)
}
