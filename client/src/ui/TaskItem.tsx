import '../App.css'

function TaskItem({ id, name, onToggle, done = false }) {

  const bgColor = (done ? 'bg-gray-600/30 hover:bg-gray-600' : 'hover:bg-gray-600/80')

  return (
    <div
      className={`flex flex-row items-center transform active:scale-[0.99] space-x-2 text-blue-50 p-3 w-full m-2 mx-auto
              transition-color duration-100 ease-out opacity-0 animate-fadeInUp rounded-xl ${bgColor}`}>
      <label className="flex items-center cursor-pointer space-x-3 btn">
        <input
          type="checkbox"
          className="peer hidden"
          checked={done}
          onChange={onToggle}
          aria-label={done ? "Mark as not done" : "Mark as done"}
        />
        <div
          className="w-8 h-8 rounded-full 
            border-2 border-white/50
            hover:bg-white/20
            peer-checked:bg-white/30 backdrop-blur-sm
            flex items-center justify-center
            focus:outline-none focus:ring-5 focus:ring-blue-400 focus:ring-offset-2
            transition-all duration-200 btn"
        >
          {!done && <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="3"
            className="w-6 h-6"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>}
        </div>
      </label>
      <p className='text-2xl mx-2'>{name + id}</p>
    </div>
  )
}

export default TaskItem
