import TaskList from "./ui/TaskList"
import TopBar from "./ui/TopBar"
import { useTasks } from "./logic/Tasks"
import { useAuth } from "./logic/Auth"
import AuthPopup from "./ui/AuthPopup"


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  return (
    <div className="font-sans justify-center w-screen h-screen bg-gray-800">
      <TopBar showDone={taskVM.showDone}
        onToggleShowDone={() => taskVM.setShowDone(prev => !prev)}
        clearDone={taskVM.clearFinished}
        username={userVM.user ? userVM.user.username : null}
        showAuth={userVM.toggleAuth}
      />
      <TaskList vm={taskVM} />
      {userVM.authenticating && <AuthPopup/>}
    </div>
  )
}
