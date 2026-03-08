import { useLayoutEffect, useRef, useState } from 'react'
import '../App.css'
import useTasks from '../logic/Tasks'

const isTouch = window.matchMedia('(pointer: coarse)').matches

type TaskItemProps = {
  id: number
  name: string
  done?: boolean
}

function TaskItem({ id, name, done = false }: Readonly<TaskItemProps>) {
  const taskVM = useTasks()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const checkboxId = `task-${id}-done`
  const [showSheet, setShowSheet] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const touchMoved = useRef(false)

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [name])

  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
    longPressTriggered.current = false
    touchMoved.current = false
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) {
        longPressTriggered.current = true
        setShowSheet(true)
      }
    }, 500)
  }

  function handleTouchMove() {
    touchMoved.current = true
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const doneStyling = done ? 'hover:bg-gray-700/80' : 'hover:bg-gray-600/80'

  return (
    <>
      <div
        className={`group flex items-center gap-2 text-blue-50 p-2.5 m-1
                    transition-colors duration-100 ease-out rounded-xl ${doneStyling}
                    ${done ? 'animate-fadeInUp-done' : 'opacity-0 animate-fadeInUp'}`}
        onTouchStart={isTouch ? handleTouchStart : undefined}
        onTouchMove={isTouch ? handleTouchMove : undefined}
        onTouchEnd={isTouch ? handleTouchEnd : undefined}
        onContextMenu={isTouch ? (e) => e.preventDefault() : undefined}
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
          <div className="w-6 h-6 rounded-full border-2 border-white/50 hover:bg-white/10 flex items-center justify-center transition-all duration-200">
            {done && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5 pointer-events-none" aria-hidden="true">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            className={`block w-full text-lg md:text-xl mx-1 rounded-lg px-2 text-gray-200 bg-transparent focus:outline-none resize-none overflow-hidden min-h-[1.5em] ${done ? 'line-through' : ''}`}
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

        {/* Hover delete button (pointer devices only) */}
        {!isTouch && <button
          onClick={() => taskVM.deleteTask(id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 flex-shrink-0"
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>}
      </div>

      {/* Mobile bottom sheet (touch devices only) */}
      {isTouch && showSheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 rounded-t-2xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="px-5 py-2 text-sm text-gray-400 truncate">{name}</p>
            <div className="px-2 pb-2">
              <button
                onClick={() => { taskVM.deleteTask(id); setShowSheet(false) }}
                className="w-full text-left px-4 py-3.5 text-base text-red-400 hover:bg-white/5 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="px-2 pb-8 pt-1 border-t border-white/10">
              <button
                onClick={() => setShowSheet(false)}
                className="w-full px-4 py-3.5 text-base text-gray-300 hover:bg-white/5 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default TaskItem
