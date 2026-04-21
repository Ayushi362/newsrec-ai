import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@/context/UserContext";
import { useArticleDetail, useRecordInteraction } from "@/hooks/useArticles";
import { useLikes } from "@/hooks/useLikes";
import { useRecommendations } from "@/hooks/useRecommendations";
import { CATEGORY_COLORS } from "@/types";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Share2,
  Tag,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

function estimateReadTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export function ArticleDetailPage() {
  const { id } = useParams({ from: "/articles/$id" });
  const navigate = useNavigate();
  const { currentUserId } = useUser();
  const interactionFiredRef = useRef(false);

  const { data: article, isLoading, isError } = useArticleDetail(id);
  const { mutate: recordInteraction } = useRecordInteraction();
  const { isLiked, toggleLike, isToggling } = useLikes(currentUserId);
  const liked = isLiked(id);

  const { data: similar, isLoading: simLoading } = useRecommendations(
    currentUserId,
    "contentBased",
    id,
    6,
  );

  const { data: forYou, isLoading: forYouLoading } = useRecommendations(
    currentUserId,
    "hybrid",
    undefined,
    4,
  );

  // Record view interaction once per article load
  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once per id
  useEffect(() => {
    if (!article || interactionFiredRef.current) return;
    interactionFiredRef.current = true;
    recordInteraction({
      userId: currentUserId,
      articleId: id,
      interactionType: "click",
    });
  }, [id, article]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on id change
  useEffect(() => {
    interactionFiredRef.current = false;
  }, [id]);

  const handleLike = () => {
    toggleLike(id);
    if (!liked) {
      recordInteraction({
        userId: currentUserId,
        articleId: id,
        interactionType: "like",
      });
      toast.success("Liked! Recommendations updated.", { duration: 3000 });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleTagClick = (tag: string) => {
    void navigate({ to: "/search", search: { q: tag, category: "" } });
  };

  const colorClass = article
    ? (CATEGORY_COLORS[article.category] ??
      "border-l-muted-foreground text-muted-foreground")
    : "";

  const readTime = article ? estimateReadTime(article.content) : "";
  const displayDate = article
    ? format(new Date(article.publishedAt), "MMM d, yyyy")
    : "";

  const paragraphs = article?.content
    ? article.content
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const tags = article?.tags ?? [];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 mb-4 text-[11px] font-mono"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="article_detail.breadcrumb_home_link"
          >
            Home
          </Link>
          <span className="text-border">/</span>
          {article && (
            <>
              <Link
                to="/search"
                search={{ q: article.category, category: article.category }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="article_detail.breadcrumb_category_link"
              >
                {article.category}
              </Link>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground truncate max-w-[200px] sm:max-w-xs">
            {article?.title ?? `Article #${id}`}
          </span>
        </nav>

        <Button
          variant="ghost"
          size="sm"
          className="mb-5 gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => void navigate({ to: "/" })}
          data-ocid="article_detail.back_button"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to feed
        </Button>

        {isLoading && (
          <div
            className="flex flex-col gap-5"
            data-ocid="article_detail.loading_state"
          >
            <Skeleton className="h-6 w-28 rounded-sm" />
            <Skeleton className="h-10 w-5/6" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
        )}

        {!isLoading && (isError || !article) && (
          <div
            className="flex flex-col items-center gap-3 py-16 bg-destructive/5 rounded-md border border-destructive/20"
            data-ocid="article_detail.error_state"
          >
            <p className="text-sm text-destructive font-medium">
              Article not found.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: "/" })}
              data-ocid="article_detail.browse_button"
            >
              Browse Articles
            </Button>
          </div>
        )}

        {!isLoading && article && (
          <article data-ocid="article_detail.section">
            {/* Hero image */}
            {article.imageUrl && (
              <div className="w-full h-56 sm:h-72 overflow-hidden rounded-xl mb-6">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <header className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border-l-2 bg-muted/40 rounded-sm font-mono ${colorClass}`}
                  data-ocid="article_detail.category_badge"
                >
                  {article.category}
                </span>
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground leading-tight mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground font-mono">
                <span className="font-medium text-foreground/70">
                  {article.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {displayDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {readTime}
                </span>
                <span>
                  {formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </header>

            {/* Sticky Action bar */}
            <div
              className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-card/95 backdrop-blur border-b border-border/40 mb-6 flex items-center gap-3"
              data-ocid="article_detail.action_bar"
            >
              <TooltipProvider delayDuration={200}>
                <Button
                  size="sm"
                  variant="outline"
                  className={[
                    "gap-1.5 text-xs transition-smooth",
                    liked
                      ? "border-chart-4/50 text-chart-4 bg-chart-4/5"
                      : "hover:border-chart-4/40 hover:text-chart-4",
                  ].join(" ")}
                  onClick={handleLike}
                  disabled={isToggling}
                  aria-label={liked ? "Unlike article" : "Like this article"}
                  data-ocid="article_detail.like_button"
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition-colors ${liked ? "fill-chart-4 text-chart-4" : ""}`}
                  />
                  <span>{liked ? "Liked" : "Like"}</span>
                  <span className="ml-0.5 tabular-nums">
                    {article.likeCount.toLocaleString()}
                  </span>
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => void handleShare()}
                      aria-label="Share article"
                      data-ocid="article_detail.share_button"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Copy link to clipboard
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Article body */}
            <div className="bg-card border border-border/50 rounded-md p-6 sm:p-8 mb-8">
              <div className="max-w-none">
                {paragraphs.length > 1 ? (
                  paragraphs.map((para) => (
                    <p
                      key={para.slice(0, 40)}
                      className="text-sm sm:text-base text-foreground leading-relaxed mb-4 last:mb-0"
                    >
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-line">
                    {article.content}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-2 mb-10"
                data-ocid="article_detail.tags_section"
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-muted/50 border border-border/40 text-muted-foreground hover:border-accent/50 hover:text-accent hover:bg-accent/5 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-ocid={`article_detail.tag.${tag.toLowerCase().replace(/\s+/g, "_")}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {/* You Might Also Like */}
            <section
              className="section-divider"
              data-ocid="similar_articles.section"
            >
              <h2 className="section-title flex items-center gap-2">
                You Might Also Like
              </h2>
              {simLoading ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  data-ocid="similar_articles.loading_state"
                >
                  {Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-36 rounded-md" />
                  ))}
                </div>
              ) : (similar ?? []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(similar ?? []).slice(0, 6).map((rec, i) => (
                    <ArticleCard
                      key={rec.article.id}
                      article={rec.article}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground py-6"
                  data-ocid="similar_articles.empty_state"
                >
                  No similar articles found yet.
                </p>
              )}
            </section>

            {/* More For You */}
            <section
              className="section-divider mt-8"
              data-ocid="for_you.section"
            >
              <h2 className="section-title flex items-center gap-2">
                More For You
              </h2>
              {forYouLoading ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  data-ocid="for_you.loading_state"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-36 rounded-md" />
                  ))}
                </div>
              ) : (forYou ?? []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(forYou ?? []).slice(0, 4).map((rec, i) => (
                    <ArticleCard
                      key={rec.article.id}
                      article={rec.article}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground py-6"
                  data-ocid="for_you.empty_state"
                >
                  Keep reading to unlock personalized recommendations.
                </p>
              )}
            </section>
          </article>
        )}
      </div>
    </Layout>
  );
}
