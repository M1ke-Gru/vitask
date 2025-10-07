import TaskList from "./ui/TaskList"
import TopBar from "./ui/TopBar"
import { useTasks } from "./logic/Tasks"
import { useAuth } from "./logic/User"
import LoginPopup from "./ui/LoginPopup"


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  return (
    <div className="justify-center w-screen h-screen bg-gray-800">
      <TopBar showDone={taskVM.showDone}
        onToggleShowDone={() => taskVM.setShowDone(prev => !prev)}
        clearFinished={taskVM.clearFinished}
        username={userVM.user ? userVM.user.username : null}
        callLogin={userVM.toggleLogin}
      />
      <TaskList vm={taskVM} />
      {userVM.logingIn && <LoginPopup close={userVM.toggleLogin} loginCallback={userVM.login}/>}
    </div>
  )
}

