import { useStore } from "@/lib/store";
import type { UserProfile } from "@/types";
import { type ReactNode, createContext, useCallback, useContext } from "react";

interface UserContextValue {
  currentUser: UserProfile | undefined;
  currentUserId: string;
  allUsers: UserProfile[];
  setCurrentUser: (userId: string) => void;
  switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { currentUserId, users, setCurrentUser } = useStore();
  const currentUser = users.find((u) => u.id === currentUserId);

  const switchUser = useCallback(
    (userId: string) => {
      setCurrentUser(userId);
    },
    [setCurrentUser],
  );

  return (
    <UserContext.Provider
      value={{
        currentUser,
        currentUserId,
        allUsers: users,
        setCurrentUser,
        switchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
