import React, { createContext, useMemo, useState } from "react";

export const AuthContext = createContext({
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      signIn: (nextUser) => setUser(nextUser),
      signOut: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
