import { createActor } from "@/backend";
import type { Article } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useTrending(limit = 6) {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;

  return useQuery<Article[]>({
    queryKey: ["trending", limit],
    queryFn: async () => {
      if (!actor) return [];
      // Fallback to getArticles if getTrendingArticles not yet available
      if (actor.getTrendingArticles) {
        try {
          return (await actor.getTrendingArticles(BigInt(limit))) as Article[];
        } catch {
          // fall through to fallback
        }
      }
      if (actor.getArticles) {
        const all = (await actor.getArticles()) as Article[];
        return all.slice(0, limit);
      }
      return [];
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}
