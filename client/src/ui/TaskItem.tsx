import '../App.css'
import { useTasks } from '../logic/Tasks'

function TaskItem({ id, name, done = false }) {
  const taskVM = useTasks()

  const doneStyling = (done ? 'hover:bg-gray-700/80' : 'hover:bg-gray-600/80')

  return (
    <div
      className={`flex flex-row items-center transform active:scale-[0.99] space-x-2 text-blue-50 p-2.5 w-full m-1 mx-auto
              transition-color duration-100 ease-out opacity-0 animate-fadeInUp rounded-xl ${doneStyling}`}>
      <label className="flex items-center cursor-pointer space-x-2 btn">
        <input
          type="checkbox"
          className="peer hidden"
          checked={done}
          onChange={() => taskVM.toggleTaskDone(id)}
          aria-label={done ? "Mark as not done" : "Mark as done"}
        />
        <div
          className="w-6 h-6 rounded-full 
            border-2 border-white/50
            hover:bg-white/20
            flex items-center justify-center
            focus:outline-none focus:ring-5 focus:ring-blue-400 focus:ring-offset-2
            transition-all duration-200 btn"
        >
          {done && <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 25 25"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>}
        </div>
      </label>
      <input
        className={"text-xl mx-1 rounded-lg px-2 text-blue-50 focus:outline-none w-full " + (done && " line-through")}
        value={name}
        onBlur={(e) => taskVM.sendNewTaskName(id, e.target.value)}
        onChange={(e) => taskVM.changeTaskName(id, e.target.value)}
        placeholder="Enter name"
      />

    </div>
  )
}

export default TaskItem
