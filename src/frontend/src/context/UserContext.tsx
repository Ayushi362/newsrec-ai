import { USER_IDS, type UserId } from "@/types";
import { type ReactNode, createContext, useContext, useState } from "react";

interface UserContextValue {
  userId: UserId;
  setUserId: (id: UserId) => void;
  userIds: UserId[];
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<UserId>(USER_IDS[0]);

  return (
    <UserContext.Provider value={{ userId, setUserId, userIds: USER_IDS }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
