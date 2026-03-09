import useTasks from "../logic/Tasks";
import { PlusIcon } from "./icons";

type EnterTaskFieldProps = {
  animIndex?: number
}

export default function EnterTaskField({ animIndex = 0 }: EnterTaskFieldProps) {
  const taskVM = useTasks();

  function submit() {
    if (taskVM.draft.trim()) {
      taskVM.addTask();
    } else {
      taskVM.setDraft("");
    }
  }

  return (
    <div
      className="task-row flex items-center px-7 md:px-10 h-16 jot-divider gap-4"
      style={{ animationDelay: `${animIndex * 0.03}s` }}
    >
      <button
        onClick={submit}
        className="btn-icon-jot w-5 h-5 rounded-full border jot-border flex-shrink-0 flex items-center justify-center jot-text-muted transition-colors"
      >
        <PlusIcon />
      </button>
      <input
        className="jot-placeholder flex-1 bg-transparent outline-none text-[15px] jot-text tracking-tight"
        placeholder="Add a task…"
        value={taskVM.draft}
        onChange={(e) => taskVM.setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit()
          if (e.key === "Escape") taskVM.setDraft("")
        }}
      />
    </div>
  );
}
