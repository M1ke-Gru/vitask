import TaskItem from "./TaskItem"
import EnterTaskField from "./EnterTaskField"
import useTasks from "../logic/Tasks"

type CategoryProps = {
  categoryId: number
  name: string
}

export default function Category({ name, categoryId }: Readonly<CategoryProps>) {
  const taskVM = useTasks()

  const categoryTasks = taskVM.tasks.filter((t) => t.categoryId === categoryId)
  const activeTasks = categoryTasks.filter((t) => !t.isDone)
  const doneTasks = categoryTasks.filter((t) => t.isDone)
  const visibleTasks = [...activeTasks, ...(taskVM.showDone ? doneTasks : [])]
  const isEmpty = categoryTasks.length === 0

  return (
    <div className="px-10 pt-8 max-w-2xl w-full">
      {isEmpty &&
        <p className="text-4xl text-white mb-6 opacity-80">Welcome to Jot!</p>}

      <div>
        {visibleTasks.map((t) => (
          <div key={t.id} className="py-0.5">
            <TaskItem id={t.id} name={t.name} done={t.isDone} />
          </div>
        ))}


        <EnterTaskField />
      </div>
    </div>
  )
}
