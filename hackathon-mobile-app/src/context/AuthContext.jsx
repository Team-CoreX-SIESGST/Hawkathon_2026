import React, { createContext, useMemo, useState } from "react";

export const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    role: null,
  });

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      role: authState.role,
      signIn: (nextAuth) =>
        setAuthState({
          user: nextAuth.user,
          token: nextAuth.token,
          role: nextAuth.role,
        }),
      signOut: () => setAuthState({ user: null, token: null, role: null }),
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
