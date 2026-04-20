import { createActor } from "@/backend";
import type { Article, SearchEntry } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useSearch(query: string, category?: string) {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;
  const trimmed = query.trim();

  return useQuery<Article[]>({
    queryKey: ["search", trimmed, category],
    queryFn: async () => {
      if (!actor?.searchArticles || !trimmed) return [];
      return actor.searchArticles(trimmed, category ?? null) as Promise<
        Article[]
      >;
    },
    enabled: !!actor && !isFetching && trimmed.length >= 2,
    staleTime: 30_000,
  });
}

export function useSearchHistory() {
  const { actor: rawActor, isFetching } = useActor(createActor);
  const actor = rawActor as AnyActor;
  const queryClient = useQueryClient();

  const historyQuery = useQuery<SearchEntry[]>({
    queryKey: ["searchHistory"],
    queryFn: async () => {
      if (!actor?.getSearchHistory) return [];
      try {
        return (await actor.getSearchHistory()) as SearchEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });

  const recordSearchMutation = useMutation({
    mutationFn: async (q: string) => {
      if (!actor?.recordSearch) return;
      return actor.recordSearch(q);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
    },
  });

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    recordSearch: recordSearchMutation.mutate,
  };
}
