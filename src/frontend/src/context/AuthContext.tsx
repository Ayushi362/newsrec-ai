import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { type ReactNode, createContext, useContext, useMemo } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  identity: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login, clear, identity, isAuthenticated } = useInternetIdentity();

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      identity: identity?.getPrincipal().toText() ?? null,
      login,
      logout: clear,
    }),
    [login, clear, identity, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
