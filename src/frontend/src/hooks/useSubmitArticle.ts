import { useStore } from "@/lib/store";
import type {
  Article,
  SubmitArticleRequest,
  SubmitArticleResult,
} from "@/types";
import { CATEGORIES } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function validateArticle(req: SubmitArticleRequest): string | null {
  if (req.title.trim().length < 10)
    return "Title must be at least 10 characters.";
  if (req.content.trim().length < 100)
    return "Content must be at least 100 characters.";
  if (!CATEGORIES.includes(req.category as (typeof CATEGORIES)[number])) {
    return "Please select a valid category.";
  }
  return null;
}

export function useSubmitArticle() {
  const { addArticle } = useStore();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (
      req: SubmitArticleRequest,
    ): Promise<SubmitArticleResult> => {
      const validationError = validateArticle(req);
      if (validationError) {
        return { kind: "failure", reason: validationError };
      }

      // Simulate brief processing delay
      await new Promise((r) => setTimeout(r, 600));

      const newArticle: Article = {
        id: `user-${Date.now()}`,
        title: req.title.trim(),
        content: req.content.trim(),
        category: req.category,
        imageUrl: `https://picsum.photos/seed/${Date.now()}/800/450`,
        author: "You",
        publishedAt: new Date().toISOString(),
        likeCount: 0,
        tags: req.tags,
      };

      addArticle(newArticle);

      return { kind: "success", articleId: newArticle.id };
    },
    onSuccess: (result) => {
      if (result.kind === "success") {
        setSubmitError(null);
        void queryClient.invalidateQueries({ queryKey: ["articles"] });
        void queryClient.invalidateQueries({ queryKey: ["trending"] });
      } else {
        setSubmitError(result.reason);
      }
    },
    onError: (err: Error) => {
      setSubmitError(err.message ?? "Submission failed");
    },
  });

  return {
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    error: submitError,
    clearError: () => setSubmitError(null),
    result: mutation.data,
  };
}
