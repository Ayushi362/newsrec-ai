import { createActor } from "@/backend";
import type { UpdateProfileRequest, UserProfile } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useUserProfile() {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;
  const queryClient = useQueryClient();

  const profileQuery = useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor?.getUserProfile) return null;
      try {
        return (await actor.getUserProfile()) as UserProfile;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });

  const updateMutation = useMutation({
    mutationFn: async (req: UpdateProfileRequest) => {
      if (!actor?.updateUserProfile) throw new Error("Method not available");
      return actor.updateUserProfile(req) as Promise<UserProfile>;
    },
    onSuccess: (updated: UserProfile) => {
      queryClient.setQueryData(["userProfile"], updated);
    },
  });

  const recordInteractionMutation = useMutation({
    mutationFn: async (articleId: bigint) => {
      if (!actor?.recordProfileInteraction) return;
      return actor.recordProfileInteraction(articleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    recordProfileInteraction: recordInteractionMutation.mutate,
  };
}
