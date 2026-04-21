import { useStore } from "@/lib/store";
import type { Article } from "@/types";
import { useQuery } from "@tanstack/react-query";

function searchArticles(
  articles: Article[],
  query: string,
  category?: string,
): Article[] {
  const q = query.toLowerCase().trim();
  if (!q && !category) return articles;

  return articles.filter((a) => {
    const matchesQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.author.toLowerCase().includes(q);

    const matchesCategory =
      !category || a.category.toLowerCase() === category.toLowerCase();

    return matchesQuery && matchesCategory;
  });
}

export function useSearch(query: string, category?: string) {
  return useQuery<Article[]>({
    queryKey: ["search", query.trim(), category],
    queryFn: async () => {
      const { articles } = useStore.getState();
      return searchArticles(articles, query, category);
    },
    enabled: query.trim().length >= 1 || !!category,
    staleTime: 30_000,
  });
}

export function useSearchHistory() {
  const { searchHistory, recordSearch } = useStore();

  return {
    history: searchHistory,
    isLoading: false,
    recordSearch,
  };
}
