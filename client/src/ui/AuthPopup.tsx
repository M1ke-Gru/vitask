import { useState } from "react";
import { useAuth } from "../logic/Auth";
import { PopupShell, PopupButton } from "./Popup";

export default function AuthPopup() {
  const { setAuthError, loginLogic, loggingIn, toggleLogin, toggleAuth, signupLogic, authError, postSignUp } = useAuth()
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const inputBase = "jot-placeholder block w-full px-0 py-2.5 bg-transparent border-b jot-border text-[15px] jot-text outline-none transition-colors focus:border-[var(--accent)]"

  return (
    <PopupShell onClose={toggleAuth}>
      <h2 className="text-3xl font-normal mb-8 jot-text">
        {loggingIn ? <>Log <span className="wordmark-o">in</span></> : <>Sign <span className="wordmark-o">up</span></>}
      </h2>

      {(authError || postSignUp) && (
        <p className={`text-sm mb-6 ${postSignUp ? "text-green-400" : "text-red-400"}`}>
          {authError || "Account created — go ahead and log in."}
        </p>
      )}

      <form
        className="flex flex-col gap-6"
        onSubmit={async (e) => {
          e.preventDefault()
          if (password.length < 8) {
            setAuthError("Password must be at least 8 characters.")
          } else {
            const success = loggingIn
              ? await loginLogic(username, password)
              : await signupLogic({ username, email, password })
            if (success && loggingIn) toggleAuth()
          }
        }}
      >
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputBase}
        />

        {!loggingIn && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputBase}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputBase}
        />

        <div className="flex gap-3 pt-2">
          <PopupButton type="button" variant="ghost" onClick={toggleLogin}>
            {loggingIn ? "Sign up" : "Log in"}
          </PopupButton>
          <PopupButton type="submit" variant="accent">
            {loggingIn ? "Log in" : "Sign up"}
          </PopupButton>
        </div>
      </form>
    </PopupShell>
  );
}
