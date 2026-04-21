import { useStore } from "@/lib/store";
import type { InteractionType, SystemMetrics } from "@/types";
import { CATEGORIES } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useMetrics() {
  return useQuery<SystemMetrics>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const { articles, users, interactions } = useStore.getState();

      const interactionsByType = interactions.reduce(
        (acc, i) => {
          acc[i.type] = (acc[i.type] ?? 0) + 1;
          return acc;
        },
        {} as Record<InteractionType, number>,
      );

      const categoryCounts = articles.reduce(
        (acc, a) => {
          acc[a.category] = (acc[a.category] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }));

      // Average similarity score from recommendation diversity
      const avgLikes =
        articles.reduce((s, a) => s + a.likeCount, 0) / articles.length;
      const maxLikes = Math.max(...articles.map((a) => a.likeCount));
      const avgSimilarity = maxLikes > 0 ? avgLikes / maxLikes : 0;

      const allInteractedArticles = new Set(
        interactions.map((i) => i.articleId),
      );
      const coverage =
        articles.length > 0 ? allInteractedArticles.size / articles.length : 0;

      return {
        totalArticles: articles.length,
        totalUsers: users.length,
        totalInteractions: interactions.length,
        averageSimilarityScore: Math.round(avgSimilarity * 100) / 100,
        recommendationCoverage: Math.round(coverage * 100) / 100,
        topCategories,
        interactionsByType,
      };
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
