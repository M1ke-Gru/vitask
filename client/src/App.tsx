import TaskList from "./ui/TaskList"
import TopBar from "./ui/TopBar"
import { useTasks } from "./logic/Tasks"
import { useAuth } from "./logic/Auth"
import AuthPopup from "./ui/AuthPopup"
import { useMediaQuery } from "react-responsive"
import EnterTaskField from "./ui/EnterTaskField"
import AddTaskButton from "./ui/AddTaskButton"


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  const isMobile = useMediaQuery({ maxWidth: 767 });

  return (
    <div className="font-sans justify-center w-screen h-screen 
      bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <TopBar showDone={taskVM.showDone}
        onToggleShowDone={() => taskVM.toggleShowDone()}
        clearDone={taskVM.clearFinished}
      />
      <TaskList />
      {(isMobile && taskVM.tasks.length > 0)
        && <div className="flex flex-row space-x-3 px-6 mb-6 absolute w-[calc(100vw)] bottom-0 left-0 ">
          <EnterTaskField value={taskVM.draft} onChange={taskVM.setDraft} />
          <AddTaskButton add={taskVM.addTask} disabled={false} />
        </div>}
      {userVM.authenticating && <AuthPopup />}
    </div>
  )
}
