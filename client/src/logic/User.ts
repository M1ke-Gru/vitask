// logic/useAuth.js
import { useState, useCallback } from "react";

type User = {
  id: string
  username: string
}

export function useAuth() {
  const [logingIn, setLogingIn] = useState(false)
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string) => {
    if (email === "abcd" && password === "abcd") {
      const newUser = { id: "abcd", username: "abcd" };
      setUser(newUser);
      return true;
    }
    return false;
  }, []);

  const toggleLogin = (() => {
    setLogingIn(!logingIn)
  })

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, login, logout, logingIn, toggleLogin };
}

