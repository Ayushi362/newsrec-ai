import { useStore } from "@/lib/store";
import type { Article } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useArticles() {
  const articles = useStore((s) => s.articles);
  return useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: async () => articles,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useArticleDetail(id: string | undefined) {
  const articles = useStore((s) => s.articles);
  return useQuery<Article | null>({
    queryKey: ["article", id],
    queryFn: async () => {
      if (!id) return null;
      return articles.find((a) => a.id === id) ?? null;
    },
    enabled: !!id,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useRecordInteraction() {
  const { recordInteraction } = useStore();
  return {
    mutate: (params: {
      userId: string;
      articleId: string;
      interactionType: "like" | "read" | "click" | "search";
    }) => {
      recordInteraction(
        params.userId,
        params.articleId,
        params.interactionType,
      );
    },
    isPending: false,
  };
}
