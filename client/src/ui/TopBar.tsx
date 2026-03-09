import "../App.css";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../logic/Auth";
import useCategories from "../logic/Categories";
import useTasks from "../logic/Tasks";
import type { CategoryRead } from "../types/category";
import { ChevronIcon, FilterIcon, PlusIcon } from "./icons";

export function TopBar() {
  const userVM = useAuth();
  const catVM = useCategories();
  const taskVM = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bottomSheet, setBottomSheet] = useState<CategoryRead | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const selected = catVM.categories.find((c) => c.id === catVM.selectedCategoryId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewName("");
        setRenamingId(null);
        setRenameValue("");
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
    if (longPressTriggered.current) return;
    catVM.selectCategory(id);
    setIsOpen(false);
  }

  function handleAdd() {
    const name = newName.trim();
    if (name) catVM.addCategory(name);
    setNewName("");
    setIsAdding(false);
  }

  function handleLongPressStart(cat: CategoryRead) {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setBottomSheet(cat);
      setIsOpen(false);
    }, 500);
  }

  function handleLongPressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function startRenameInDropdown(cat: CategoryRead) {
    setBottomSheet(null);
    setRenamingId(cat.id);
    setRenameValue(cat.name);
    setIsOpen(true);
  }

  function submitRename() {
    if (renamingId !== null) {
      const name = renameValue.trim();
      if (name) catVM.renameCategory(renamingId, name);
      setRenamingId(null);
      setRenameValue("");
    }
  }

  const completedCount = taskVM.tasks.filter(
    (t) => t.categoryId === catVM.selectedCategoryId && t.isDone
  ).length;
  const totalCount = taskVM.tasks.filter(
    (t) => t.categoryId === catVM.selectedCategoryId
  ).length;

  return (
    <>
      {/* Mobile header — hidden on desktop */}
      <header className="md:hidden px-7 pt-12 pb-6 jot-divider relative z-10">
        <div className="flex items-start justify-between mb-5">
          <h1 className="text-4xl font-normal leading-none tracking-tight jot-text">
            J<span className="wordmark-o">o</span>t
          </h1>
          <div className="flex items-center gap-2 pt-1">
            {/* Filter dropdown */}
            <div ref={filterRef} className="relative">
              <button
                onClick={() => setIsFilterOpen((o) => !o)}
                className="btn-icon-jot w-9 h-9 rounded-full border jot-border flex items-center justify-center jot-text-sec transition-colors"
              >
                <FilterIcon />
              </button>
              {isFilterOpen && (
                <div className="absolute top-full right-0 mt-1 w-52 jot-sidebar-bg border jot-border rounded-xl shadow-xl py-1 z-20">
                  <button
                    onClick={taskVM.toggleShowDone}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm jot-text-sec transition-colors"
                  >
                    <span>Show completed</span>
                    <div className={`toggle-track ${taskVM.showDone ? "on" : ""}`}>
                      <div className="toggle-thumb" />
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => userVM.user ? userVM.logout() : userVM.toggleAuth()}
              className="btn-logout-jot text-[11px] font-medium tracking-widest uppercase jot-text-sec border jot-border px-3.5 py-1.5 rounded-full transition-colors"
            >
              {userVM.user ? "Log out" : "Log in"}
            </button>
          </div>
        </div>

        {/* Category selector + count */}
        <div className="flex items-center justify-between">
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsOpen((o) => !o)}
              className="view-sel flex items-center gap-1.5 text-xs tracking-wider jot-text-sec transition-colors"
            >
              {selected?.name ?? "Select list"} <ChevronIcon />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 min-w-48 jot-sidebar-bg border jot-border rounded-xl shadow-xl py-1 z-20">
                {catVM.categories.map((c) =>
                  renamingId === c.id ? (
                    <div key={c.id} className="px-3 py-1">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { submitRename(); setIsOpen(false); }
                          if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                        }}
                        onBlur={submitRename}
                        placeholder="Category name"
                        className="jot-placeholder w-full bg-transparent text-sm jot-text border-b jot-border pb-1 outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      onTouchStart={() => handleLongPressStart(c)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchCancel={handleLongPressEnd}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors select-none
                        ${c.id === catVM.selectedCategoryId ? "jot-text" : "jot-text-sec"}`}
                    >
                      {c.id === catVM.selectedCategoryId && (
                        <span className="mr-2" style={{ color: "var(--accent)" }}>✓</span>
                      )}
                      {c.name}
                    </button>
                  )
                )}

                <div className="border-t jot-border mt-1 pt-1">
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
                        placeholder="List name…"
                        className="jot-placeholder w-full bg-transparent text-sm jot-text border-b jot-border pb-1 outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm jot-text-muted transition-colors"
                    >
                      <PlusIcon /> New list
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-[11px] tracking-widest jot-text-muted uppercase">
            {completedCount} / {totalCount} done
          </span>
        </div>
      </header>

      {/* Mobile bottom sheet for category actions */}
      {bottomSheet && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setBottomSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 jot-sidebar-bg border-t jot-border rounded-t-2xl shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <p className="px-5 py-2 text-xs jot-text-muted uppercase tracking-widest">{bottomSheet.name}</p>
            <div className="px-2 pb-2">
              <button
                onClick={() => startRenameInDropdown(bottomSheet)}
                className="w-full text-left px-4 py-3.5 text-base jot-text-sec transition-colors rounded-xl"
              >
                Rename
              </button>
              <button
                onClick={() => { catVM.deleteCategory(bottomSheet.id); setBottomSheet(null); }}
                disabled={catVM.categories.length <= 1}
                className="w-full text-left px-4 py-3.5 text-base text-red-400 rounded-xl transition-colors disabled:opacity-30"
              >
                Delete
              </button>
            </div>
            <div className="px-2 pb-8 pt-1 border-t jot-border">
              <button
                onClick={() => setBottomSheet(null)}
                className="w-full px-4 py-3.5 text-base jot-text-sec rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
