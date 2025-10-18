import { useState } from "react";
import { useAuth } from "../logic/Auth";
import { ApiError } from "../types/auth"


export default function LoginPopup() {
  const { user, loginLogic, loggingIn, toggleLogin, toggleAuth, signupLogic, authError } = useAuth()
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const redBorder = authError ? ' border-2 border-red-700' : ''
  const textInput = 'block w-full p-2 rounded-lg bg-gray-700/80 border-1 border-gray-600/80 text-white text-lg focus:outline-none txt-area' + redBorder

  return (
    <div className="fixed inset-0 z-50 duration-100 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center min-h-screen min-w-screen">
        <div className="relative bg-gray-900/50 border-1 animate-fadeInUp  border-gray-700 backdrop-blur-xl rounded-2xl p-8 w-md text-center">

          <button
            onClick={toggleAuth}
            className="absolute top-4 right-4 text-blue-50 rounded-full text-xl w-8 h-8 hover:bg-gray-700 transition"
          >
            ✕
          </button>

          <h2 className="text-3xl font-bold my-4 mb-12 text-blue-50">
            {loggingIn ? "Log in" : "Sign up"}
          </h2>


          {authError && <p className="text-red-400 mb-8">{authError}</p>}

          <form className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              loggingIn ? await loginLogic(username, password) : await signupLogic({ username, email, password })
              console.log(user)
              user ? useAuth((state) => ({ state: state.toggleAuth })) : useAuth(() => { authError: true })
            }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={textInput}
            />

            {!loggingIn && <input type="email" placeholder="Email" className={textInput} value={email} onChange={(e) => setEmail(e.target.value)}></input>}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={textInput}
            />
            <div className="w-full flex flex-column space-x-4 my-12 mb-0 text-md">
              <button className="py-3 rounded-full text-white/90 hover:bg-white/10 border border-white/10 bg-white/2 px-3 m-auto w-40" type="button" onClick={toggleLogin} >
                {loggingIn ? "Sign up instead" : "Log in instead"}
              </button>
              <button className="bg-blue-600 hover:bg-blue-500 active:scale-95 transition rounded-full py-3 px-3 w-40 m-auto font-semibold text-blue-50" type="submit">
                {loggingIn ? "Log in" : "Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
