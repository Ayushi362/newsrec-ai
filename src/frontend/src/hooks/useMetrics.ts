import { createActor } from "@/backend";
import type { SystemMetrics } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

export function useMetrics() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SystemMetrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      if (!actor) {
        return {
          averageSimilarityScore: 0,
          totalArticles: BigInt(0),
          totalUsers: BigInt(0),
          totalInteractions: BigInt(0),
          recommendationCoverage: 0,
        };
      }
      return actor.getMetrics();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}
