import TaskItem from "./TaskItem"
import AddTask from "./AddTask"
import EnterTask from "./EnterTask"

export default function TaskList({ vm }) {
  return (
    <div className="flex flex-col align-middle w-2/3 mx-auto">
      <div className="flex flex-row space-x-3 my-4 my-2 ">
        <EnterTask value={vm.draft} onChange={vm.setDraft} />
        <AddTask add={vm.add} disabled={false} />
      </div>

      <div className="bg-gray-700/80 backdrop-blur-md border backdrop-blur-md border-white/10 rounded-2xl px-2">
        {vm.visible.map((t, i, ar) => (
          <>
            <TaskItem
              key={t.id}
              id={t.id}
              name={t.name}
              done={t.isDone}
              onToggle={vm.toggleDone}
            />
            {i < ar.length - 1 && <div className="h-px bg-white/20 w-[98%] mx-auto" />}
          </>
        ))}
      </div>
    </div>
  )
}

