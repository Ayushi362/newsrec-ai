import { createActor } from "@/backend";
import type { ArticleId } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useLikes() {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;
  const queryClient = useQueryClient();

  const likedQuery = useQuery<ArticleId[]>({
    queryKey: ["userLikes"],
    queryFn: async () => {
      if (!actor?.getUserLikes) return [];
      try {
        return (await actor.getUserLikes()) as ArticleId[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const toggleMutation = useMutation({
    mutationFn: async (articleId: ArticleId) => {
      if (!actor?.toggleArticleLike) throw new Error("Method not available");
      return actor.toggleArticleLike(articleId) as Promise<bigint>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["userLikes"] });
      void queryClient.invalidateQueries({ queryKey: ["likeCounts"] });
    },
  });

  const isLiked = (articleId: ArticleId) =>
    (likedQuery.data ?? []).some((id) => id === articleId);

  return {
    likedArticles: likedQuery.data ?? [],
    isLoading: likedQuery.isLoading,
    toggleLike: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    isLiked,
  };
}

export function useLikeCount(articleId: ArticleId | undefined) {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;

  return useQuery<bigint>({
    queryKey: ["likeCounts", articleId?.toString()],
    queryFn: async () => {
      if (!actor?.getArticleLikeCount || articleId === undefined)
        return BigInt(0);
      return actor.getArticleLikeCount(articleId) as Promise<bigint>;
    },
    enabled: !!actor && !isFetching && articleId !== undefined,
  });
}
