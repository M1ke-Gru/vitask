import "../App.css"

export default function TopBar({ showDone, onToggleShowDone, clearDone, showAuth, username }) {
  const btn = "btn py-3 text-blue-50 text-center items-center text-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] "
  const btnClear = "w-32 hover:bg-white/20  rounded-full " + btn
  const btnLogin = "w-32 bg-blue-600/90 hover:bg-blue-600 rounded-full " + btn
  return (
    <div className="flex justify-between items-center gap-2 mb-4 bg-gray-950 h-20 m-0 px-6">
      <h1 className="text-blue-50 font-bold w-30 text-3xl">Vitask</h1>
      <div className="space-x-5">
        <button
          id="showDone"
          onClick={onToggleShowDone}
          className={btnClear}
        >{!showDone ? "Show done" : "Hide done"}</button>

        <button
          id="clearDone"
          onClick={clearDone}
          className={btnClear}
        >
          Clear done
        </button>
        <button id="login" onClick={showAuth} className={btnLogin}>{username ? username : "Log in"}</button>
      </div>
    </div>
  )
}

