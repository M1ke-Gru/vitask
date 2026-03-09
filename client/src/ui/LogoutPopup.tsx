import { useAuth } from "../logic/Auth";
import { PopupShell, PopupButton } from "./Popup";

export default function LogoutPopup() {
  const { logout, cancelLogout } = useAuth();

  return (
    <PopupShell onClose={cancelLogout} maxWidth="max-w-xs">
      <h2 className="text-3xl font-normal mb-2 jot-text">
        Log <span className="wordmark-o">out</span>?
      </h2>
      <p className="text-[13px] jot-text-muted mb-8">
        You'll need to sign back in to sync your tasks.
      </p>

      <div className="flex gap-3">
        <PopupButton variant="ghost" onClick={cancelLogout}>Cancel</PopupButton>
        <PopupButton variant="danger" onClick={logout}>Log out</PopupButton>
      </div>
    </PopupShell>
  );
}
