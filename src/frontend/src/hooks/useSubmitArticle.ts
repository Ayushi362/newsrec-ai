import { createActor } from "@/backend";
import type { SubmitArticleRequest, SubmitArticleResult } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function useSubmitArticle() {
  const { actor: rawActor } = useActor(createActor);
  const actor = rawActor as AnyActor;
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (
      req: SubmitArticleRequest,
    ): Promise<SubmitArticleResult> => {
      if (!actor?.submitArticle) throw new Error("Actor not ready");
      const raw = await actor.submitArticle(req);
      if (raw && typeof raw === "object") {
        if ("success" in raw) {
          const success = raw as { success: { articleId: bigint } };
          return { kind: "success", articleId: success.success.articleId };
        }
        if ("failure" in raw) {
          const failure = raw as { failure: { reason: string } };
          return { kind: "failure", reason: failure.failure.reason };
        }
      }
      return { kind: "failure", reason: "Unknown response format" };
    },
    onSuccess: (result: SubmitArticleResult) => {
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
