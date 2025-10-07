import '../App.css'

function TaskItem({ id, name, onToggle, done = false }) {

  const transition = "rounded-lg transition-colors duration-150"
  const bgColor = (done ? 'bg-gray-600/90 hover:bg-gray-600' : 'bg-blue-600/90 hover:bg-blue-600') + " " + transition
  const buttonColor = (done ? 'bg-gray-700' : 'bg-blue-700') + " " + transition

  return (
    <div className={`flex flex-row space-x-2 text-blue-50 p-2 justify-center w-full hover:scale-101 m-2 mx-auto ` + bgColor}>
      <button type="button" className={'p-2 py-1 rounded-lg text-xl ' + buttonColor} onClick={() => onToggle(id)}>{done ? "Done" : "Do"}</button>
      <p className='text-xl m-auto'>{name}</p>
    </div>
  )
}

export default TaskItem
