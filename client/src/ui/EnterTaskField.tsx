import "../App.css";
import useTasks from "../logic/Tasks";
import AddTaskButton from "./AddTaskButton";

export default function EnterTaskField() {
  const taskVM = useTasks()
  const style = `
    flex justify-between
    border-1 rounded-full shadow-black/30 shadow-md border-slate-600 text-blue-50
    hover:border-slate-500 focus:border-slate-500/70 focus:bg-slate-700
    bg-slate-700/80 w-full h-14 text-xl px-2 focus:ring-0
    transition duration-150 txt-area mb-4
  `

  return (
    <div className={style}>
      <input
        value={taskVM.draft}
        onChange={(e) => taskVM.setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            taskVM.addTask();
          }
        }}
        placeholder="Enter your new task"
        className="my-auto px-4 px-auto w-full"
      />
      <AddTaskButton add={taskVM.addTask} recording={false} />
    </div>
  )
}
