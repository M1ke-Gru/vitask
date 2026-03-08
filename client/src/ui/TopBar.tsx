import "../App.css";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../logic/Auth";
import useCategories from "../logic/Categories";
import useTasks from "../logic/Tasks";

export function TopBar() {
  const userVM = useAuth();
  const catVM = useCategories();
  const taskVM = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const selected = catVM.categories.find((c) => c.id === catVM.selectedCategoryId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewName("");
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  function handleSelect(id: number) {
    catVM.selectCategory(id);
    setIsOpen(false);
  }

  function handleAdd() {
    const name = newName.trim();
    if (name) catVM.addCategory(name);
    setNewName("");
    setIsAdding(false);
  }

  const btn =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-md font-medium " +
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60";
  const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-500 text-white`;

  return (
    <div className={`sticky top-0 z-20 flex items-center justify-between gap-3
                    bg-gray-950 my-0
                    border border-gray-950/70 border-b-white/15 border-t-white/15 px-4 h-16`}>
      <div className="flex items-center gap-3">
        <h1 className="text-blue-50 font-semibold tracking-tight text-2xl md:w-44 md:flex-shrink-0">
          Jot
        </h1>
        <div ref={dropdownRef} className="relative md:hidden">
          <button
            onClick={() => setIsOpen((o) => !o)}
            className="flex items-center gap-1.5 pl-4 pr-2 py-1.5 rounded-lg text-lg font-normal
                       text-gray-300 hover:bg-white/5 transition-colors outline-none"
          >
            {selected?.name ?? "Select list"}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
              className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-48 rounded-xl
                            bg-gray-900 border border-white/10 shadow-xl py-1 z-20">
              {catVM.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors
                    ${c.id === catVM.selectedCategoryId
                      ? "text-white bg-white/5"
                      : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                >
                  {c.id === catVM.selectedCategoryId && (
                    <span className="mr-2 text-blue-400">✓</span>
                  )}
                  {c.name}
                </button>
              ))}

              <div className="border-t border-white/10 mt-1 pt-1">
                {isAdding ? (
                  <div className="px-3 py-1">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                        if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
                      }}
                      onBlur={handleAdd}
                      placeholder="List name"
                      className="w-full px-2 py-1 rounded-lg bg-gray-800 text-white text-sm
                                 outline-none border border-blue-500/50"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    + New list
                  </button>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div ref={filterRef} className="relative md:hidden">
          <button
            onClick={() => setIsFilterOpen((o) => !o)}
            className={`p-2 rounded-lg transition-colors outline-none
              ${isFilterOpen ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            title="Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="absolute top-full right-0 mt-1 w-52 rounded-xl
                            bg-gray-900 border border-white/10 shadow-xl py-1 z-20">
              <button
                onClick={taskVM.toggleShowDone}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300
                           hover:bg-white/5 transition-colors"
              >
                <span>Show completed</span>
                <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${taskVM.showDone ? "bg-blue-500" : "bg-gray-600"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${taskVM.showDone ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          id="auth"
          onClick={() => (userVM.user ? userVM.logout() : userVM.toggleAuth())}
          className={btnPrimary}
          title={userVM.user ? `Logged in as ${userVM.user.username}` : "Log in"}
        >
          {userVM.user ? "Log out" : "Log in"}
        </button>
      </div>
    </div>
  );
}
