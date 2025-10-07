import TaskItem from "./TaskItem"
import AddTask from "./AddTask"
import EnterTask from "./EnterTask"

export default function TaskList({ vm }) {
  return (
    <div className="flex flex-col align-middle w-2/3 mx-auto">
      <div className="flex flex-row space-x-3 my-2">
        <EnterTask value={vm.draft} onChange={vm.setDraft} />
        <AddTask add={vm.add}/>
      </div>

      {vm.visible.map(t => (
        <TaskItem
          key={t.id}
          id={t.id}
          name={t.name}
          done={t.isDone}
          onToggle={vm.toggleDone}   // child calls onToggle(id)
        />
      ))}
    </div>
  )
}

