import TaskList from "./ui/TaskList"
import TopBar from "./ui/TopBar"
import { useTasks } from "./logic/Tasks"
import { useAuth } from "./logic/Auth"
import AuthPopup from "./ui/AuthPopup"


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  return (
    <div className="font-sans justify-center w-screen h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <TopBar showDone={taskVM.showDone}
        onToggleShowDone={() => taskVM.toggleShowDone()}
        clearDone={taskVM.clearFinished}
      />
      <TaskList />
      {userVM.authenticating && <AuthPopup />}
    </div>
  )
}
