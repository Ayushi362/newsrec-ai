import { Badge } from "@/components/ui/badge";
import { useUser } from "@/context/UserContext";
import { useLikes } from "@/hooks/useLikes";
import { type Article, CATEGORY_COLORS } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Clock, Heart } from "lucide-react";

interface ArticleCardProps {
  article: Article;
  index?: number;
  onCardClick?: (article: Article) => void;
  compact?: boolean;
}

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

const CAT_ICONS: Record<string, string> = {
  Technology: "💻",
  Business: "📈",
  Health: "🏥",
  Science: "🔬",
  Sports: "⚽",
  Entertainment: "🎬",
  Politics: "🏛️",
};

export function ArticleCard({
  article,
  index,
  onCardClick,
  compact = false,
}: ArticleCardProps) {
  const navigate = useNavigate();
  const { currentUserId } = useUser();
  const { isLiked, toggleLike, isToggling } = useLikes(currentUserId);
  const liked = isLiked(article.id);

  const preview = article.content.slice(0, compact ? 80 : 140).trimEnd();
  const colorClass =
    CATEGORY_COLORS[article.category] ??
    "border-l-muted-foreground text-muted-foreground";
  const readTime = estimateReadTime(article.content);
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  const handleClick = () => {
    if (onCardClick) {
      onCardClick(article);
    } else {
      void navigate({ to: "/articles/$id", params: { id: article.id } });
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
        <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0 bg-muted/40 flex items-center justify-center">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
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
      {/* Image */}
      <div className="w-full h-40 overflow-hidden bg-muted/30">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Card body */}
      <button
        type="button"
        className="w-full text-left flex flex-col gap-2 p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={handleClick}
      >
        <span
          className={`inline-block w-fit px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider border-l-2 bg-muted/40 rounded-sm ${colorClass}`}
        >
          {CAT_ICONS[article.category] ?? "📰"} {article.category}
        </span>
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors font-display">
          {article.title}
        </h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {preview}
          {article.content.length > 140 ? "…" : ""}
        </p>
      </button>

      {/* Footer row */}
      <div className="flex items-center justify-between px-4 pb-3 pt-0">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
          <span>{article.author}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readTime}
          </span>
          <span className="hidden sm:block">{timeAgo}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
            {article.likeCount.toLocaleString()}
          </span>
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
        </div>
      </div>
    </div>
  );
}
