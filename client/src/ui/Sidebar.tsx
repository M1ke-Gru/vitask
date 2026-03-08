import { useEffect, useRef, useState } from "react"
import useCategories from "../logic/Categories"
import useTasks from "../logic/Tasks"

export default function Sidebar() {
  const catVM = useCategories()
  const taskVM = useTasks()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [menuOpenFor, setMenuOpenFor] = useState<number | null>(null)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenFor(null)
      }
    }
    if (menuOpenFor !== null) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpenFor])

  function handleAdd() {
    const name = newName.trim()
    if (name) catVM.addCategory(name)
    setNewName("")
    setIsAdding(false)
  }

  function startRename(id: number, name: string) {
    setRenamingId(id)
    setRenameValue(name)
    setMenuOpenFor(null)
  }

  function submitRename() {
    if (renamingId !== null) {
      const name = renameValue.trim()
      if (name) catVM.renameCategory(renamingId, name)
      setRenamingId(null)
      setRenameValue("")
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-white/10 bg-gray-800/30 py-4 pt-6 px-3 gap-6">

      <div className="flex flex-col gap-0.5">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 px-2">Categories</p>
        <nav className="flex flex-col gap-0.5">
          {catVM.categories.map((c) => (
            <div key={c.id} className="relative group/item">
              {renamingId === c.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename()
                    if (e.key === "Escape") { setRenamingId(null); setRenameValue("") }
                  }}
                  onBlur={submitRename}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white text-sm outline-none border border-blue-500/50"
                />
              ) : (
                <>
                  <button
                    onClick={() => catVM.selectCategory(c.id)}
                    className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-sm transition-colors outline-none
                      ${c.id === catVM.selectedCategoryId
                        ? "bg-white/10 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                  >
                    {c.name}
                  </button>

                  {/* ··· button — visible on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenFor(c.id === menuOpenFor ? null : c.id)
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-base leading-none tracking-widest"
                  >
                    ···
                  </button>

                  {/* Dropdown menu */}
                  {menuOpenFor === c.id && (
                    <div
                      ref={menuRef}
                      className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-30 py-1"
                    >
                      <button
                        onClick={() => startRename(c.id, c.name)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => { catVM.deleteCategory(c.id); setMenuOpenFor(null) }}
                        disabled={catVM.categories.length <= 1}
                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
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
