import { useAuth } from "../logic/Auth";

export default function LogoutPopup() {
  const { logout, cancelLogout } = useAuth();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative bg-gray-900/60 border border-slate-700 backdrop-blur-xl rounded-2xl p-8 w-80 text-center animate-fadeInUp">
          <button
            onClick={cancelLogout}
            className="absolute top-4 right-4 text-blue-50 rounded-full text-xl w-8 h-8 hover:bg-slate-700 transition"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mt-4 mb-3 text-blue-50">Log out?</h2>
          <p className="text-gray-400 text-sm mb-8">You'll need to log back in to sync your tasks.</p>

          <div className="flex gap-3">
            <button
              onClick={cancelLogout}
              className="flex-1 py-3 rounded-full text-white/90 hover:bg-white/10 border border-white/10 bg-white/2 transition"
            >
              Cancel
            </button>
            <button
              onClick={logout}
              className="flex-1 py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition font-semibold text-blue-50"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
