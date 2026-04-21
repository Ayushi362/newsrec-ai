import { getTrendingArticles } from "@/lib/recommendationEngine";
import { useStore } from "@/lib/store";
import type { Article } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useTrending(limit = 6) {
  return useQuery<Article[]>({
    queryKey: ["trending", limit],
    queryFn: async () => {
      const { articles } = useStore.getState();
      return getTrendingArticles(articles, limit);
    },
    staleTime: 60_000,
  });
}
