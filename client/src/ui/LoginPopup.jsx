import { useState } from "react";

export default function LoginPopup({ close, loginCallback }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [incorrectAttempt, setIncorrectAttempt] = useState(false)
  const redBorder = incorrectAttempt ? ' border-2 border-red-700' : ''
  const textInput = 'block w-full mb-6 p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500' + redBorder

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative bg-gray-800 rounded-2xl shadow-xl p-8 w-[90%] max-w-sm text-center">

          <button
            onClick={close}
            className="absolute top-4 right-4 bg-gray-700 text-blue-50 rounded-xl w-10 h-10 hover:bg-gray-600 transition"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-6 text-blue-50">Sign in</h2>

          {incorrectAttempt && <p className="text-red-400 mb-6">Incorrect email or password</p>}

          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={textInput}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={textInput}
          />


          <button className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition rounded-lg py-2 font-semibold text-blue-50" onClick={async () => {
            const user = await loginCallback(email, password);
            user ? close() : setIncorrectAttempt(true)
          }}>
            Sign In
          </button>

        </div>
      </div>
    </div>
  );
}

