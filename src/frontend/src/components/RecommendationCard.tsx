import { Badge } from "@/components/ui/badge";
import type { RecommendationResult } from "@/types";
import { ALGORITHM_COLORS, ALGORITHM_LABELS } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface RecommendationCardProps {
  result: RecommendationResult;
  index?: number;
  /** Compact mode for sidebar — smaller text, tighter padding */
  compact?: boolean;
}

export function RecommendationCard({
  result,
  index,
  compact,
}: RecommendationCardProps) {
  const navigate = useNavigate();
  const { article, score, confidence, algorithmSource } = result;
  const preview = article.content.slice(0, compact ? 70 : 100).trimEnd();
  const scorePercent = Math.round(score * 100);
  const confPercent = Math.round(confidence * 100);

  return (
    <button
      type="button"
      className={[
        "group w-full text-left bg-card border border-border/50 rounded-md flex flex-col cursor-pointer",
        "hover:border-accent/40 hover:shadow-sm hover:-translate-y-0.5 transition-smooth",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "gap-2 p-3" : "gap-2.5 p-4",
      ].join(" ")}
      onClick={() =>
        void navigate({
          to: "/articles/$id",
          params: { id: article.id.toString() },
        })
      }
      data-ocid={
        index !== undefined ? `rec_card.item.${index + 1}` : "rec_card"
      }
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border rounded-sm font-mono truncate ${ALGORITHM_COLORS[algorithmSource]}`}
        >
          <Sparkles className="h-2 w-2 shrink-0" />
          {ALGORITHM_LABELS[algorithmSource]}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] text-muted-foreground font-mono">
            score
          </span>
          <span className="text-[10px] font-bold text-accent font-mono tabular-nums">
            {scorePercent}%
          </span>
        </div>
      </div>

      <h4
        className={[
          "font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-200 font-display min-w-0",
          compact ? "text-xs" : "text-sm",
        ].join(" ")}
      >
        {article.title}
      </h4>

      {!compact && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 text-left">
          {preview}
          {article.content.length > 100 ? "…" : ""}
        </p>
      )}

      {compact && preview && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-1 text-left">
          {preview}…
        </p>
      )}

      <div className="flex items-center justify-between pt-0.5 mt-auto">
        <Badge
          variant="secondary"
          className="text-[9px] font-mono px-1.5 py-0 h-4 rounded-sm bg-muted/60 text-muted-foreground border-0"
        >
          {article.category}
        </Badge>
        <div className="flex items-center gap-1.5">
          {!compact && (
            <>
              <span className="text-[9px] text-muted-foreground font-mono">
                conf.
              </span>
              <div className="w-12 h-1 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent/70 rounded-full transition-all duration-500"
                  style={{ width: `${confPercent}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-mono tabular-nums">
                {confPercent}%
              </span>
            </>
          )}
          <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-accent transition-smooth" />
        </div>
      </div>
    </button>
  );
}
