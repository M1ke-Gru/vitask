import '../App.css'
import useTasks from '../logic/Tasks'

type TaskItemProps = {
  id: number,
  name: string,
  done?: boolean
}

function TaskItem({ id, name, done = false }: Readonly<TaskItemProps>) {
  const taskVM = useTasks()
  const doneStyling = done ? 'hover:bg-gray-700/80' : 'hover:bg-gray-600/80'
  const checkboxId = `task-${id}-done`

  return (
    <div
      className={`group flex items-center gap-2 text-blue-50 p-2.5 w-full m-1 mx-auto
                  transition-colors duration-100 ease-out opacity-0 animate-fadeInUp rounded-xl ${doneStyling} min-w-0`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="sr-only peer"
        checked={done}
        onChange={() => taskVM.toggleTaskDone(id)}
        aria-label={done ? "Mark as not done" : "Mark as done"}
      />

      <label
        htmlFor={checkboxId}
        className="shrink-0 cursor-pointer select-none inline-flex"
        title={done ? "Mark as not done" : "Mark as done"}
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-white/50
                     hover:bg-white/20 flex items-center justify-center
                     transition-all duration-200"
        >
          {done && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 25 25"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="w-5 h-5 pointer-events-none"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </label>

      {/* text input */}
      <input
        className={`text-xl mx-1 rounded-lg px-2 text-gray-200 ${done ? 'line-through' : ''
          }`}
        value={name}
        onBlur={(e) => taskVM.sendNewTaskName(id, e.target.value)}
        onChange={(e) => taskVM.changeTaskName(id, e.target.value)}
        placeholder="Enter name"
      />
    </div>
  )
}

export default TaskItem

