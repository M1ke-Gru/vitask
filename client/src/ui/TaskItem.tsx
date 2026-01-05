import { useLayoutEffect, useRef } from 'react'
import '../App.css'
import useTasks from '../logic/Tasks'

type TaskItemProps = {
  id: number,
  name: string,
  done?: boolean
}

function TaskItem({ id, name, done = false }: Readonly<TaskItemProps>) {
  const taskVM = useTasks()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const doneStyling = done ? 'hover:bg-gray-700/80' : 'hover:bg-gray-600/80'
  const checkboxId = `task-${id}-done`

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [name])

  console.log('TaskItem rendering', { id, name }); // Debug: Verify new code is running

  return (
    <div
      className={`group flex items-center gap-2 text-blue-50 p-2.5 m-1
                  transition-colors duration-100 ease-out opacity-0 animate-fadeInUp rounded-xl ${doneStyling}`}
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
      <div className="flex-1 min-w-0">
        <textarea
          ref={textareaRef}
          rows={1}
          className={`block w-full text-xl mx-1 rounded-lg px-2 text-gray-200 bg-transparent focus:outline-none resize-none overflow-hidden min-h-[1.5em] ${done ? 'line-through' : ''}`}
          value={name}
          onBlur={(e) => taskVM.sendNewTaskName(id, e.target.value)}
          onChange={(e) => taskVM.changeTaskName(id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
          placeholder="Enter name"
        />
      </div>
    </div>
  )
}

export default TaskItem
