import "../App.css";
import { useAuth } from "../logic/Auth";
import { useMediaQuery } from "react-responsive"

type Props = {
  showDone: boolean;
  onToggleShowDone: () => void;
  clearDone: () => void;
};

export default function TopBar({ showDone, onToggleShowDone, clearDone }: Props) {
  const userVM = useAuth();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const btn =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-md font-medium " +
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60";

  const btnSecondary = `${btn} text-white/90 hover:bg-white/15 bg-white/1 border border-white/10`;
  const btnPrimary = `${btn} bg-blue-600 hover:bg-blue-500 text-white`;

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3
                    bg-gray-950/70 backdrop-blur h-16 my-0 mb-2
                    border-1 border-b-white/15 px-4 md:px-6 py-3">
      <h1 className="text-blue-50 font-semibold tracking-tight text-2xl md:text-2xl">
        Vitask
      </h1>

      <div className="flex items-center gap-3">
        <button id="showDone" onClick={onToggleShowDone} className={btnSecondary}>
          {showDone ? "Hide done" : "Show done"}
        </button>

        <button id="clearDone" onClick={clearDone} className={btnSecondary}>
          Clear done
        </button>

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

