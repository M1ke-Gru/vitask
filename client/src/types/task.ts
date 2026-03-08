export type TaskCreate = {
  name: string
  isDone: boolean
  categoryId?: number
}

export type TaskRead = {
  id: number
  name: string
  isDone: boolean
  categoryId: number
}
