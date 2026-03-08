import { useState } from "react"
import useCategories from "../logic/Categories"
import useTasks from "../logic/Tasks"

export default function Sidebar() {
  const catVM = useCategories()
  const taskVM = useTasks()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")

  function handleAdd() {
    const name = newName.trim()
    if (name) catVM.addCategory(name)
    setNewName("")
    setIsAdding(false)
  }

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-white/10 bg-gray-800/30 py-4 pt-6 px-3 gap-6">

      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-2">Categories</p>
        <nav className="flex flex-col gap-0.5">
          {catVM.categories.map((c) => (
            <button
              key={c.id}
              onClick={() => catVM.selectCategory(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors outline-none
                ${c.id === catVM.selectedCategoryId
                  ? "bg-white/10 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              {c.name}
            </button>
          ))}
        </nav>
        {isAdding ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") { setIsAdding(false); setNewName("") }
            }}
            onBlur={handleAdd}
            placeholder="Category name"
            className="mt-0.5 w-full px-3 py-2 rounded-lg bg-gray-800 text-white text-sm outline-none border border-blue-500/50"
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 transition-colors outline-none"
          >
            + New list
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-6">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-2">Filters</p>
        <button
          onClick={taskVM.toggleShowDone}
          className="flex items-center justify-between px-2 py-2 rounded-lg text-sm text-gray-400
                     hover:text-white hover:bg-white/5 transition-colors outline-none"
        >
          <p className="ml-0 pl-0">Show completed</p>
          <div className={`w-8 h-4 rounded-full ml-auto transition-colors relative flex-shrink-0 ${taskVM.showDone ? "bg-blue-500" : "bg-gray-600"}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${taskVM.showDone ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
        </button>
      </div>

    </aside>
  )
}
