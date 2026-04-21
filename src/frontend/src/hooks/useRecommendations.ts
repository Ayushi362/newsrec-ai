import {
  collaborativeRecs,
  contentBasedRecs,
  hybridRecs,
} from "@/lib/recommendationEngine";
import { useStore } from "@/lib/store";
import type { RecommendationResult } from "@/types";
import { useQuery } from "@tanstack/react-query";

type RecommendationMode = "hybrid" | "collaborative" | "contentBased";

export function useRecommendations(
  userId: string,
  mode: RecommendationMode = "hybrid",
  seedArticleId?: string,
  topN = 6,
) {
  return useQuery<RecommendationResult[]>({
    queryKey: ["recommendations", userId, mode, seedArticleId, topN],
    queryFn: async () => {
      const state = useStore.getState();
      const userProfile = state.users.find((u) => u.id === userId) ?? null;

      if (mode === "collaborative") {
        return collaborativeRecs(userId, state.users, state.articles, topN);
      }

      if (mode === "contentBased" && seedArticleId) {
        const article = state.articles.find((a) => a.id === seedArticleId);
        if (article) {
          return contentBasedRecs(article, state.articles, userProfile, topN);
        }
      }

      return hybridRecs(
        userId,
        seedArticleId ?? null,
        state.users,
        state.articles,
        userProfile,
        topN,
      );
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
