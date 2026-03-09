import { useEffect, useRef, useState } from "react"
import useCategories from "../logic/Categories"
import useTasks from "../logic/Tasks"
import { useAuth } from "../logic/Auth"
import { PlusIcon } from "./icons"

export default function Sidebar() {
  const catVM = useCategories()
  const taskVM = useTasks()
  const userVM = useAuth()
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
    <aside className="jot-sidebar-bg jot-divider-r relative z-10 hidden md:flex flex-col w-52 shrink-0 pt-8 pb-8 px-4">
      <h1 className="text-3xl font-normal leading-none tracking-tight px-2 mb-8 jot-text">
        J<span className="wordmark-o">o</span>t
      </h1>

      <p className="text-[10px] tracking-widest uppercase jot-text-muted font-medium px-2 mb-2">Categories</p>
      <nav className="flex flex-col gap-0.5 mb-3">
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
                className="jot-placeholder w-full bg-transparent outline-none text-sm jot-text border-b jot-border pb-1 px-2"
              />
            ) : (
              <>
                <button
                  onClick={() => catVM.selectCategory(c.id)}
                  className={`list-item w-full text-left text-sm px-2 py-1.5 pr-8 transition-colors outline-none jot-text-sec
                    ${c.id === catVM.selectedCategoryId ? "list-item-active" : ""}`}
                >
                  {c.name}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenFor(c.id === menuOpenFor ? null : c.id)
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center jot-text-muted hover:jot-text text-base leading-none tracking-widest"
                >
                  ···
                </button>

                {menuOpenFor === c.id && (
                  <div
                    ref={menuRef}
                    className="absolute left-0 right-0 top-full mt-1 jot-sidebar-bg border jot-border rounded-lg shadow-xl z-30 py-1"
                  >
                    <button
                      onClick={() => startRename(c.id, c.name)}
                      className="w-full text-left px-3 py-2 text-sm jot-text-sec hover:jot-text transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => { catVM.deleteCategory(c.id); setMenuOpenFor(null) }}
                      disabled={catVM.categories.length <= 1}
                      className="w-full text-left px-3 py-2 text-sm text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
        <div className="px-2 mb-4">
          <input
            autoFocus
            className="jot-placeholder w-full bg-transparent outline-none text-sm jot-text border-b jot-border pb-1"
            placeholder="List name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") setIsAdding(false)
            }}
            onBlur={() => { if (!newName.trim()) setIsAdding(false) }}
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm jot-text-muted px-2 py-1.5 transition-colors mb-4"
          style={{ opacity: 0.7 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
        >
          <PlusIcon /> <span>New list</span>
        </button>
      )}

      <div className="mx-2 mb-5" style={{ height: "1.5px", background: "var(--border)" }} />

      <p className="text-[10px] tracking-widest uppercase jot-text-muted font-medium px-2 mb-3">Filters</p>
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-sm jot-text-sec">Show completed</span>
        <div
          className={`toggle-track ${taskVM.showDone ? "on" : ""}`}
          onClick={taskVM.toggleShowDone}
        >
          <div className="toggle-thumb" />
        </div>
      </div>

      <div className="flex-1" />
      {userVM.bootstrapped && (
        <button
          onClick={() => userVM.user ? userVM.logout() : userVM.toggleAuth()}
          className="btn-logout-jot text-[11px] font-medium tracking-widest uppercase jot-text-muted border jot-border px-3 py-1.5 rounded-full transition-colors mx-2"
        >
          {userVM.user ? "Log out" : "Log in"}
        </button>
      )}
    </aside>
  )
}
