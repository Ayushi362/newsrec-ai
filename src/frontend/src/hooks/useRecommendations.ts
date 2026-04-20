import { createActor } from "@/backend";
import type { ArticleId, RecommendationsResponse } from "@/types";
import { AlgorithmSource } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useRecommendations(
  userId: string,
  algorithm: AlgorithmSource,
  seedArticleId?: ArticleId,
  topN = 6,
) {
  const { actor, isFetching } = useActor(createActor);
  const algValue = algorithm ?? AlgorithmSource.hybrid;
  return useQuery<RecommendationsResponse>({
    queryKey: [
      "recommendations",
      userId,
      algValue,
      seedArticleId?.toString(),
      topN,
    ],
    queryFn: async () => {
      if (!actor) return { algorithmUsed: algValue, recommendations: [] };
      return actor.getRecommendations(
        userId,
        algValue,
        seedArticleId ?? null,
        BigInt(topN),
      );
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}
