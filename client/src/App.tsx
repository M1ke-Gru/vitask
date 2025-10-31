import { useEffect } from "react";
import TaskList from "./ui/TaskList"
import { TopBar } from "./ui/TopBar"
import useTasks from "./logic/Tasks"
import { useAuth } from "./logic/Auth"
import AuthPopup from "./ui/AuthPopup"
import { useMediaQuery } from "react-responsive"
import EnterTaskField from "./ui/EnterTaskField"
import { useConnection } from "./api/check_connection";


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const connection = useConnection()

  useEffect(() => {
    if (!connection.isConnected && !connection.isReconnecting) {
      const timeout = setTimeout(() => {
        connection.waitToReconnect(taskVM.onReconnect);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [connection.isConnected, connection.isReconnecting]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <TopBar />
      <TaskList />
      {(isMobile && taskVM.tasks.length > 0)
        && <div className="px-6 mb-2 absolute w-[calc(100vw)] bottom-0 left-0 ">
          <EnterTaskField />
        </div>}
      {userVM.authenticating && <AuthPopup />}
    </div>
  )
}
