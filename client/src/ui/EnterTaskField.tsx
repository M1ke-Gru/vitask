import "../App.css";
import useTasks from "../logic/Tasks";
import { useState } from "react";

export default function EnterTaskField() {
  const taskVM = useTasks();
  const [isEditing, setIsEditing] = useState(false);

  function submit() {
    if (taskVM.draft.trim()) {
      taskVM.addTask();
    } else {
      taskVM.setDraft("");
    }
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      taskVM.setDraft("");
      setIsEditing(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 w-full p-2.5 m-1 rounded-xl
                   text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="w-6 h-6 text-blue-500 flex-shrink-0">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        <span className="text-lg md:text-xl pl-3">Add task</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2.5 m-1 rounded-xl">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        className="w-6 h-6 text-blue-500 flex-shrink-0">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
      </svg>
      <input
        autoFocus
        value={taskVM.draft}
        onChange={(e) => taskVM.setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={submit}
        placeholder="New task"
        className="flex-1 bg-transparent text-base md:text-xl text-gray-200 placeholder-gray-500
                   outline-none rounded-lg px-1"
      />
    </div>
  );
}
