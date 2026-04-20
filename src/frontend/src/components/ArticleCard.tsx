import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLikes } from "@/hooks/useLikes";
import { type Article, CATEGORY_COLORS } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Heart } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  index?: number;
  onCardClick?: (article: Article) => void;
  /** compact row style (used in recommendation sidebars) */
  compact?: boolean;
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function ArticleThumbnail({ category }: { category: string }) {
  const GRADIENTS: Record<string, string> = {
    Technology: "from-accent/30 to-accent/5",
    Business: "from-chart-3/30 to-chart-3/5",
    Health: "from-chart-5/30 to-chart-5/5",
    Science: "from-chart-2/30 to-chart-2/5",
    World: "from-muted/60 to-muted/20",
    Sports: "from-primary/30 to-primary/5",
    Entertainment: "from-chart-4/30 to-chart-4/5",
    Finance: "from-chart-3/30 to-chart-3/5",
    Politics: "from-chart-4/30 to-chart-4/5",
  };
  const gradient = GRADIENTS[category] ?? "from-muted/60 to-muted/20";
  return (
    <div
      className={`shrink-0 rounded-sm bg-gradient-to-br ${gradient} flex items-center justify-center`}
    >
      <span className="text-2xl select-none" aria-hidden="true">
        {category === "Technology"
          ? "💻"
          : category === "Business"
            ? "📈"
            : category === "Health"
              ? "🏥"
              : category === "Science"
                ? "🔬"
                : category === "Sports"
                  ? "⚽"
                  : category === "Entertainment"
                    ? "🎬"
                    : category === "World" || category === "World News"
                      ? "🌍"
                      : "📰"}
      </span>
    </div>
  );
}

export function ArticleCard({
  article,
  index,
  onCardClick,
  compact = false,
}: ArticleCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isLiked, toggleLike, isToggling } = useLikes();
  const liked = isLiked(article.id);

  const preview = article.content.slice(0, compact ? 80 : 120).trimEnd();
  const colorClass =
    CATEGORY_COLORS[article.category] ??
    "border-l-muted-foreground text-muted-foreground";
  const readTime = estimateReadTime(article.content);

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(article);
    } else {
      void navigate({
        to: "/articles/$id",
        params: { id: article.id.toString() },
      });
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isToggling) toggleLike(article.id);
  };

  if (compact) {
    return (
      <button
        type="button"
        className="group w-full text-left bg-card/50 border border-border/40 rounded-sm p-3 flex gap-3 items-start cursor-pointer hover:border-border hover:bg-card transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={handleClick}
        data-ocid={
          index !== undefined
            ? `article_card.item.${index + 1}`
            : "article_card"
        }
      >
        <ArticleThumbnail category={article.category} />
        <div className="flex flex-col gap-1 min-w-0">
          <span
            className={`text-[9px] font-mono font-semibold uppercase tracking-wider border-l-2 pl-1 ${colorClass}`}
          >
            {article.category}
          </span>
          <p className="text-xs font-semibold text-foreground line-clamp-2 font-display group-hover:text-accent transition-colors">
            {article.title}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div
      className="group bg-card border border-border/50 rounded-md hover:border-border hover:shadow-md transition-smooth overflow-hidden"
      data-ocid={
        index !== undefined ? `article_card.item.${index + 1}` : "article_card"
      }
    >
      {/* Card body — click navigates */}
      <button
        type="button"
        className="w-full text-left flex gap-4 p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-md"
        onClick={handleClick}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden shrink-0">
          <ArticleThumbnail category={article.category} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span
            className={`inline-block w-fit px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider border-l-2 bg-muted/40 rounded-sm ${colorClass}`}
          >
            {article.category}
          </span>
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors font-display">
            {article.title}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {preview}
            {article.content.length > 120 ? "…" : ""}
          </p>
        </div>
      </button>

      {/* Footer row */}
      <div className="flex items-center justify-between px-4 pb-3 pt-1">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readTime}
          </span>
          {article.termFrequencies.slice(0, 2).map(([term]) => (
            <Badge
              key={term}
              variant="secondary"
              className="text-[9px] font-mono px-1.5 py-0 h-4 rounded-sm bg-muted/60 border-0"
            >
              {term}
            </Badge>
          ))}
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLike}
            disabled={isToggling}
            aria-label={liked ? "Unlike article" : "Like article"}
            className="p-1.5 rounded-sm hover:bg-muted/40 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid={
              index !== undefined
                ? `article_card.like_button.${index + 1}`
                : "article_card.like_button"
            }
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${liked ? "fill-chart-4 text-chart-4" : "text-muted-foreground/50 hover:text-chart-4"}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
