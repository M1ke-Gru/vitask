import { useState } from "react"
import TaskItem from "./TaskItem"
import EnterTaskField from "./EnterTaskField"
import useTasks from "../logic/Tasks"

type CategoryProps = {
  categoryId: number
  name: string
}

export default function Category({ name, categoryId }: Readonly<CategoryProps>) {
  const taskVM = useTasks()
  const [popping, setPopping] = useState<{ id: number; completing: boolean } | null>(null)

  const categoryTasks = taskVM.tasks.filter((t) => t.categoryId === categoryId)
  const activeTasks = categoryTasks.filter((t) => !t.isDone)
  const doneTasks = categoryTasks.filter((t) => t.isDone)
  const visibleTasks = [...activeTasks, ...(taskVM.showDone ? doneTasks : [])]

  const completedCount = doneTasks.length
  const progress = categoryTasks.length ? (completedCount / categoryTasks.length) * 100 : 0

  function handleToggle(id: number, isDone: boolean) {
    taskVM.toggleTaskDone(id)
    setPopping({ id, completing: !isDone })
    setTimeout(() => setPopping(null), 300)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Desktop category header */}
      <header className="hidden md:flex items-end justify-between px-10 pt-10 pb-6 jot-divider">
        <div>
          <h2 className="text-3xl font-normal leading-none tracking-tight mb-1.5 jot-text">
            {name}
          </h2>
          <span className="text-[11px] tracking-widest jot-text-muted uppercase">
            {completedCount} / {categoryTasks.length} done
          </span>
        </div>
      </header>

      {/* Task list */}
      <div className="flex-1 pb-24">
        {visibleTasks.map((t, i) => (
          <TaskItem
            key={t.id}
            id={t.id}
            name={t.name}
            done={t.isDone}
            animIndex={i}
            isPopping={popping?.id === t.id}
            completing={popping?.id === t.id ? popping.completing : false}
            onToggle={() => handleToggle(t.id, t.isDone)}
          />
        ))}
        <EnterTaskField animIndex={visibleTasks.length} />
      </div>

      {/* Progress bar */}
      <div
        className="sticky bottom-0 z-20 px-7 md:px-10 pb-7 pt-5"
        style={{ background: "linear-gradient(to top, var(--bg) 55%, transparent)" }}
      >
        <div className="flex justify-between text-[11px] tracking-widest uppercase jot-text-muted mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full rounded-full overflow-hidden" style={{ background: "var(--border)", height: "1.5px" }}>
          <div
            className="progress-fill h-full rounded-full"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      </div>
    </div>
  )
}
