import { useStore } from "@/lib/store";
import type { Article } from "@/types";

export function useLikes(userId: string) {
  const toggleLike = useStore((s) => s.toggleLike);
  const articles = useStore((s) => s.articles);
  const likedArticles = useStore(
    (s) => s.users.find((u) => u.id === userId)?.likedArticles ?? [],
  );

  const isLiked = (articleId: string) => likedArticles.includes(articleId);

  const toggle = (articleId: string) => {
    toggleLike(userId, articleId);
  };

  const likedArticleObjects: Article[] = likedArticles
    .map((id) => articles.find((a) => a.id === id))
    .filter((a): a is Article => a !== undefined);

  return {
    likedArticles,
    likedArticleObjects,
    isLoading: false,
    toggleLike: toggle,
    isToggling: false,
    isLiked,
  };
}

export function useLikeCount(articleId: string | undefined): {
  data: number;
  isLoading: boolean;
} {
  const count = useStore((s) => {
    if (!articleId) return 0;
    return s.articles.find((a) => a.id === articleId)?.likeCount ?? 0;
  });

  return { data: count, isLoading: false };
}
