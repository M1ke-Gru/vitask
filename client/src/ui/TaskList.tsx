import TaskItem from "./TaskItem"
import AddTask from "./AddTask"
import EnterTask from "./EnterTask"
import { useTasks } from "../logic/Tasks"

export default function TaskList() {
  const taskVM = useTasks()
  return (
    <div className="flex flex-col justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 align-middle w-4xl mx-auto">
      {(taskVM.tasks.length === 0) && <p className="text-5xl text-white mb-6">Welcome to Vitask!</p>}
      <div className="flex flex-row space-x-3 mb-4 ">
        <EnterTask value={taskVM.draft} onChange={taskVM.setDraft} />
        <AddTask add={taskVM.addTask} disabled={false} />
      </div>

      {(taskVM.tasks.length > 0) && <div className="bg-gray-700/80 backdrop-blur-md border backdrop-blur-md border-white/10 rounded-2xl px-1.5 py-1">
        {taskVM.getVisibleTasks().map((t, i, ar) => (
          <>
            <TaskItem
              key={t.id}
              id={t.id}
              name={t.name}
              done={t.isDone}
            />
            {i < ar.length - 1 && <div className="h-px bg-white/20 w-[98%] mx-auto" />}
          </>
        ))}
      </div>}
    </div>
  )
}

