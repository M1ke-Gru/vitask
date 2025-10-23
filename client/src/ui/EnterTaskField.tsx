import { useTasks } from "../logic/Tasks"

export default function EnterTaskField({ value, onChange }) {
  const taskVM = useTasks()
  const style = `
    border-1 rounded-2xl border-gray-600 text-blue-50
    focus:outline-none hover:border-gray-500 focus:bg-gray-700/90
    bg-gray-700/80 px-6 w-full h-14 text-xl focus:ring-0 focus:border-gray-500
    transition duration-150 txt-area
  `

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
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
