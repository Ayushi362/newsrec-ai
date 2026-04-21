import { useStore } from "@/lib/store";
import type { UserProfile } from "@/types";
import { CATEGORIES } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useUserProfile(userId?: string) {
  const currentUserId = useStore((s) => s.currentUserId);
  const targetId = userId ?? currentUserId;

  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ["userProfile", targetId],
    queryFn: async () => {
      const state = useStore.getState();
      return state.users.find((u) => u.id === targetId) ?? null;
    },
    enabled: !!targetId,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const updateProfile = (
    updates: Partial<Pick<UserProfile, "name" | "region" | "interests">>,
  ) => {
    useStore.setState((state) => ({
      users: state.users.map((u) =>
        u.id === targetId ? { ...u, ...updates } : u,
      ),
    }));
  };

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    updateProfile,
    isUpdating: false,
    categories: CATEGORIES,
  };
}
