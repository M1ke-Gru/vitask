import "../App.css";
import { useAuth } from "../logic/Auth";


export function TopBar() {
  const userVM = useAuth();

  const btn =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-md font-medium " +
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60";
  const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-500 text-white`;

  return (
    <div className={`sticky top-0 z-20 flex items-center justify-between gap-3
                    bg-gray-950/70 backdrop-blur my-0 mb-2
                    border border-gray-950/70 border-b-white/15 border-t-white/15 px-4 h-16`}>
      <h1 className="text-blue-50 font-semibold tracking-tight text-2xl">
        Vitask
      </h1>

      <div className="flex items-center gap-3">
        <button
          id="auth"
          onClick={() => (userVM.user ? userVM.logout() : userVM.toggleAuth())}
          className={btnPrimary}
          title={userVM.user ? `Logged in as ${userVM.user.username}` : "Log in"}
        >
          {userVM.user ? "Log out" : "Log in"}
        </button>
      </div>
    </div>
  );
}

