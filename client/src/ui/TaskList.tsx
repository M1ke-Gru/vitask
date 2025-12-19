import TaskItem from "./TaskItem"
import EnterTaskField from "./EnterTaskField"
import useTasks from "../logic/Tasks"
import { useMediaQuery } from "react-responsive"
import { useState } from "react"

export default function TaskList() {
  const taskVM = useTasks()
  const [showDone, setShowDone] = useState(false)
  const isMobile = useMediaQuery({ maxWidth: 767 });
  return (
    <div className="flex flex-col justify-center absolute top-[49%] md:pt-16 left-1/2 -translate-x-1/2 -translate-y-1/2 align-middle w-screen max-w-4xl mx-auto px-6 ">
      {(taskVM.tasks.length === 0) &&
        <p className="drop-shadow-[0_4px_12px_rgba(0,0,0,16)] text-5xl text-white mb-6 "
        >Welcome to Vitask!</p>}
      {(!isMobile || taskVM.tasks.length === 0) && <EnterTaskField />}
      <div className="rounded-2xl shadow-black/30 shadow-md overflow-hidden">
        {(taskVM.tasks.length > 0) &&
          <div className="bg-slate-700/70 shadow-md max-h-[calc(100dvh-200px)] overflow-y-auto backdrop-blur-md 
            rounded-2xl border border-white/10 px-1.5 py-1"
            style={{
              scrollbarGutter: 'stable both-edges',
              overscrollBehavior: 'contain',
            }}
          >
            {taskVM.tasks.filter(
              t => { if (!t.isDone) return t }
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
            <div className="flex flex-col m-1 p-2 bg-slate-800/90 border-1 border-gray-500/30 rounded-xl">
              <div className="flex mx-1 pb-0 justify-between">
                <button className="flex hover:bg-white/10 rounded-lg" onClick={() => setShowDone(!showDone)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`h-6 w-6 text-gray-300 transition-transform duration-200 ${showDone ? "" : "rotate-[-90deg]"}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-gray-300 my-auto px-1.5">Show finished</p>
                </button>
                <button className="text-red-500" onClick={taskVM.clearFinished}>Delete</button>
              </div>
              <div
                className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${showDone ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                  }`}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-2 rounded-xl">
                    {taskVM.tasks.filter((t) => t.isDone).length === 0 ? (
                      <li className="text-sm text-gray-500 mx-2 m-1">Nothing here</li>
                    ) : (
                      taskVM.tasks.filter(
                        t => { if (t.isDone) return t }
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
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>
  )
}
