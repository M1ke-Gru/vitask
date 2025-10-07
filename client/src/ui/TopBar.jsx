import "../App.css"

export default function TopBar({ showDone, onToggleShowDone, clearFinished, callLogin, username }) {
  const btn = "btn py-3 text-blue-50 text-center items-center "
  const btnClear = "w-32 bg-gray-800 hover:bg-gray-700 " + btn
  const btnLogin = "w-40 bg-blue-600 hover:bg-blue-500 " + btn
  return (
    <div className="flex justify-between items-center gap-2 mb-4 bg-gray-950 h-20 m-0 px-6">
      <h1 className="text-blue-50 font-bold w-30 text-3xl">Vitask</h1>
      <div className="space-x-6">
        <button
          id="showFinished"
          type="checkbox"
          onClick={onToggleShowDone}
          className={btnClear}
        >{!showDone ? "Show finished" : "Hide finished"}</button>

        <button
          id="clearFinished"
          onClick={clearFinished}
          className={btnClear}
        >
          Clear finished
        </button>
        <button id="login" onClick={callLogin} className={btnLogin}>{username ? username : "Login"}</button>
      </div>
    </div>
  )
}

