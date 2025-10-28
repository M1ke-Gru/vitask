import TaskItem from "./TaskItem"
import AddTaskButton from "./AddTaskButton"
import EnterTaskField from "./EnterTaskField"
import { useTasks } from "../logic/Tasks"
import { useMediaQuery } from "react-responsive"

export default function TaskList() {
  const taskVM = useTasks()
  const isMobile = useMediaQuery({ maxWidth: 767 });
  return (
    <div className="flex flex-col justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 align-middle w-screen max-w-4xl mx-auto px-6 ">
      {(taskVM.tasks.length === 0) && <p className="text-5xl text-white mb-6 ">Welcome to Vitask!</p>}
      {(!isMobile || taskVM.tasks.length === 0) && <div className="flex flex-row space-x-3 mb-4 ">
        <EnterTaskField value={taskVM.draft} onChange={taskVM.setDraft} />
        <AddTaskButton add={taskVM.addTask} disabled={false} />
      </div>}

      {(taskVM.tasks.length > 0) && <div className="bg-gray-700/80 shadow-md backdrop-blur-md border border-white/10 rounded-2xl px-1.5 py-1">
        {taskVM.tasks.filter(
          t => { if (!t.isDone || taskVM.showDone) return t }
        ).map((t, i, ar) => (
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

