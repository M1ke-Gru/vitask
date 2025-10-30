import "../App.css";
import { useTasks } from "../logic/Tasks";

export default function EnterTaskField() {
  const taskVM = useTasks()
  const style = `
    border-1 rounded-2xl shadow-black/30 shadow-md border-slate-600 text-blue-50
    focus:outline-none hover:border-slate-500 focus:border-slate-500/70 focus:bg-slate-700
    bg-slate-700/80 px-6 w-full h-14 text-xl focus:ring-0
    transition duration-150 txt-area
  `

  return (
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
      className={style}
    />
  )
}
