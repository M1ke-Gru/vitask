import { useRef, useState } from 'react'
import useTasks from '../logic/Tasks'
import { CheckIcon } from './icons'

const isTouch = window.matchMedia('(pointer: coarse)').matches

type TaskItemProps = {
  id: number
  name: string
  done?: boolean
  animIndex?: number
  isPopping?: boolean
  completing?: boolean
  onToggle: () => void
}

function TaskItem({ id, name, done = false, animIndex = 0, isPopping = false, completing = false, onToggle }: Readonly<TaskItemProps>) {
  const taskVM = useTasks()
  const [showSheet, setShowSheet] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)
  const touchMoved = useRef(false)

  function handleTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
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
    if (!longPressTriggered.current && !touchMoved.current) {
      onToggle()
    }
  }

  return (
    <>
      <div
        className="task-row flex items-center px-7 md:px-10 h-16 jot-divider cursor-pointer transition-colors group"
        style={{ animationDelay: `${animIndex * 0.03}s` }}
        onClick={isTouch ? undefined : onToggle}
        onTouchStart={isTouch ? handleTouchStart : undefined}
        onTouchMove={isTouch ? handleTouchMove : undefined}
        onTouchEnd={isTouch ? handleTouchEnd : undefined}
        onContextMenu={isTouch ? (e) => e.preventDefault() : undefined}
      >
        {/* Circular checkbox */}
        <div
          className={`w-5 h-5 rounded-full border flex-shrink-0 mr-4 flex items-center justify-center transition-colors duration-200 ${isPopping ? 'check-pop' : ''}`}
          style={{
            borderColor: done ? '#4a7a5a' : 'var(--text-muted)',
            background: done ? '#4a7a5a' : 'transparent',
          }}
        >
          {done && <CheckIcon />}
        </div>

        {/* Task name — inline editable on pointer devices */}
        <div className="flex-1 min-w-0">
          {isTouch ? (
            <p
              className={`text-[15px] font-normal tracking-tight truncate ${isPopping ? (completing ? 'text-strike' : 'text-unstrike') : ''}`}
              style={{
                color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: 'var(--text-secondary)',
              }}
            >
              {name}
            </p>
          ) : (
            <input
              className={`w-full bg-transparent outline-none text-[15px] font-normal tracking-tight jot-placeholder truncate
                ${isPopping ? (completing ? 'text-strike' : 'text-unstrike') : ''}`}
              style={{
                color: done ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: done ? 'line-through' : 'none',
                textDecorationColor: 'var(--text-secondary)',
              }}
              value={name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => taskVM.changeTaskName(id, e.target.value)}
              onBlur={(e) => taskVM.sendNewTaskName(id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              placeholder="Task name"
            />
          )}
        </div>

        {/* Hover delete (pointer only) */}
        {!isTouch && (
          <button
            onClick={(e) => { e.stopPropagation(); taskVM.deleteTask(id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 jot-text-muted hover:text-red-400"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isTouch && showSheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 jot-sidebar-bg border-t jot-border rounded-t-2xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <p className="px-5 py-2 text-sm jot-text-muted truncate">{name}</p>
            <div className="px-2 pb-2">
              <button
                onClick={() => { taskVM.deleteTask(id); setShowSheet(false) }}
                className="w-full text-left px-4 py-3.5 text-base text-red-400 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
            <div className="px-2 pb-8 pt-1 border-t jot-border">
              <button
                onClick={() => setShowSheet(false)}
                className="w-full px-4 py-3.5 text-base jot-text-sec rounded-xl transition-colors font-medium"
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
