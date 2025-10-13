import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { create } from "zustand";

type Task = {
  id: string
  name: string
  isDone: boolean
}

function sortTasks(ts: Array<Task>) {
  return [...ts].sort((a, b) => {
    const aDone = a.isDone ? 1 : 0;
    const bDone = b.isDone ? 1 : 0;
    return (aDone - bDone) || a.name.localeCompare(b.name);
  });
}

type tasksState = {
  tasks: Array<Task>
  showDone: boolean
  draft: string

  // Task batch manipulation
  setDraft: (draft: string) => void
  clearFinished: () => void
  getVisibleTasks: () => Array<Task>

  // Manipulate a specific task
  addTask: (task: Task) => void
  changeTaskName: (id: string, name: string) => void
  toggleTaskDone: (id: string) => void
}

export const useTasks = create<tasksState>((set, get) => ({
  tasks: [],
  showDone: true,
  draft: "",

  setDraft: (draft: string) => set({ draft: draft }),

  toggleTaskDone: (id: string) => set((state) => ({
    tasks: state.tasks.map((task) => (task.id === id) ? {...task, isDone: !task.isDone} : task)
  })),

  addTask: () => {
    const name = get().draft.trim()
    if (!name) return
    set({
      tasks: [...get().tasks, { id: nanoid(), name, isDone: false }],
      draft: "",
    })
  },



  clearFinished: () => set((state) => ({
    tasks: state.tasks.filter(t => !t.isDone)
  })),

  getVisibleTasks: () => {
    return (get().showDone ? get().tasks : get().tasks.filter(t => !t.isDone))
  },

  getTask: (id: string) => {
    return get().tasks.find((task) => (task.id === id))
  },

  changeTaskName: (id: string, name: string) => set((state) => ({
    tasks: state.tasks.map((task) => (task.id === id ? { ...task, name: name } : task))
  }))

}))
