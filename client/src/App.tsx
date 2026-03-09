import { useEffect } from "react";
import Main from "./ui/Main"
import useCategories from "./logic/Categories"
import { TopBar } from "./ui/TopBar"
import Sidebar from "./ui/Sidebar"
import useTasks from "./logic/Tasks"
import { useAuth } from "./logic/Auth"
import AuthPopup from "./ui/AuthPopup"
import LogoutPopup from "./ui/LogoutPopup"
import { useConnection } from "./api/check_connection";


export default function App() {
  const taskVM = useTasks()
  const userVM = useAuth()
  const connection = useConnection()

  useEffect(() => {
    useAuth.getState().bootstrap();
  }, []);

  useEffect(() => {
    if (!connection.isConnected && !connection.isReconnecting) {
      const timeout = setTimeout(() => {
        connection.waitToReconnect(async () => {
          await taskVM.onReconnect();
          await useCategories.getState().fetchCategories();
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [connection.isConnected, connection.isReconnecting]);

  return (
    <div className="grain font-body fixed inset-0 jot-bg jot-text flex">
      <Sidebar />
      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto relative">
          <Main />
        </main>
      </div>
      {userVM.authenticating && <AuthPopup />}
      {userVM.confirmingLogout && <LogoutPopup />}
    </div>
  )
}
