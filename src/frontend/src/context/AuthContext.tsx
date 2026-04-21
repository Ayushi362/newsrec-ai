import { type ReactNode, createContext, useContext } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  identity: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Standalone mode: always authenticated as a demo user
  return (
    <AuthContext.Provider value={{ isAuthenticated: true, identity: "demo" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
