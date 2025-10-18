import { TaskCreate, TaskRead } from "../types/task"
import api from "./auth"

export async function createTask(task: TaskCreate): Promise<TaskRead> {
  const { data } = await api.post<TaskRead>("/task/create", task)
  return data
}

export async function getTask(task_id: number): Promise<TaskRead> {
  const { data } = await api.get<TaskRead>("/task/" + task_id)
  return data
}

export async function deleteTask(task_id: number): Promise<void> {
  await api.delete("/task/" + task_id)
}

export async function changeDone(task_id: number, task_part: {  isDone: boolean }): Promise<void> {
  await api.patch(`/task/is_done/${task_id}/${task_part.isDone}`)
}

export async function changeName(task_id: number, task_part: { name: string }): Promise<void> {
  await api.patch(`/task/name/${task_id}/${task_part.name}`)
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
