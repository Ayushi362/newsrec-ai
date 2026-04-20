import { createActor } from "@/backend";
import type { Article, ArticleId } from "@/types";
import { InteractionType } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useArticles() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Article[]>({
    queryKey: ["articles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArticles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useArticleDetail(id: ArticleId | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Article | null>({
    queryKey: ["article", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) return null;
      return actor.getArticleDetail(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useRecordInteraction() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      articleId,
      interactionType,
    }: {
      userId: string;
      articleId: ArticleId;
      interactionType: InteractionType;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // Default to click interaction type if not specified
      const iType = interactionType ?? InteractionType.click;
      return actor.recordInteraction({
        userId,
        articleId,
        interactionType: iType,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      void queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
  });
}
