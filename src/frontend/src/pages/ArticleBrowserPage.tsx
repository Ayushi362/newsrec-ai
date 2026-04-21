import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useArticles } from "@/hooks/useArticles";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useTrending } from "@/hooks/useTrending";
import { useUserProfile } from "@/hooks/useUserProfile";
import { type Article, CATEGORIES } from "@/types";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Heart,
  Newspaper,
  Settings,
  Sparkles,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

const CATEGORY_GRADIENTS: Record<string, string> = {
  Technology: "from-accent/40 via-accent/15 to-transparent",
  Business: "from-chart-3/40 via-chart-3/15 to-transparent",
  Health: "from-chart-5/40 via-chart-5/15 to-transparent",
  Science: "from-chart-2/40 via-chart-2/15 to-transparent",
  Sports: "from-primary/40 via-primary/15 to-transparent",
  Entertainment: "from-chart-4/40 via-chart-4/15 to-transparent",
  Politics: "from-chart-1/40 via-chart-1/15 to-transparent",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Technology: "bg-accent/20 text-accent border-accent/30",
  Business: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  Health: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  Science: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  Sports: "bg-primary/20 text-primary border-primary/30",
  Entertainment: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  Politics: "bg-chart-1/20 text-chart-1 border-chart-1/30",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Technology: "💻",
  Business: "📈",
  Health: "🏥",
  Science: "🔬",
  Sports: "⚽",
  Entertainment: "🎬",
  Politics: "🏛️",
};

function getExcerpt(content: string, maxLen = 160): string {
  if (content.length <= maxLen) return content;
  return `${content.slice(0, maxLen).trimEnd()}…`;
}

function HeroCard({ article }: { article: Article }) {
  const navigate = useNavigate();
  const gradient =
    CATEGORY_GRADIENTS[article.category] ??
    "from-muted/60 via-muted/25 to-transparent";
  const badgeColor =
    CATEGORY_BADGE_COLORS[article.category] ??
    "bg-muted text-muted-foreground border-border";

  const goToArticle = () =>
    void navigate({ to: "/articles/$id", params: { id: article.id } });

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card shadow-md group"
      data-ocid="hero.card"
    >
      {article.imageUrl && (
        <div className="absolute inset-0">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover opacity-25 group-hover:opacity-30 transition-opacity duration-500"
          />
        </div>
      )}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/30 to-transparent pointer-events-none" />

      <button
        type="button"
        className="absolute inset-0 z-[5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        onClick={goToArticle}
        aria-label={`Read article: ${article.title}`}
      />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-4 min-h-[260px] sm:min-h-[300px] justify-end pointer-events-none">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] font-mono font-semibold uppercase tracking-wider border px-2.5 py-0.5 rounded-sm ${badgeColor}`}
          >
            {CATEGORY_EMOJIS[article.category] ?? "📰"} {article.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(article.publishedAt).toLocaleDateString()}
          </span>
        </div>

        <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground leading-tight tracking-tight group-hover:text-accent transition-colors max-w-3xl line-clamp-2">
          {article.title}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-2">
          {getExcerpt(article.content, 200)}
        </p>

        <Button
          size="sm"
          className="w-fit gap-2 bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm pointer-events-auto"
          data-ocid="hero.read_button"
          onClick={goToArticle}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Read Article
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CategoryStrip({
  active,
  onChange,
}: { active: string; onChange: (cat: string) => void }) {
  const all = ["All", ...CATEGORIES];
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="tablist"
      data-ocid="category_strip.list"
    >
      {all.map((cat) => {
        const isActive = active === cat;
        const badgeColor =
          cat === "All"
            ? isActive
              ? "bg-foreground text-background border-foreground"
              : "bg-muted text-muted-foreground border-border hover:border-foreground/30"
            : isActive
              ? (CATEGORY_BADGE_COLORS[cat] ??
                "bg-accent/20 text-accent border-accent/30")
              : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:border-border";
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${badgeColor}`}
            data-ocid={`category_strip.${cat.toLowerCase()}_tab`}
          >
            {cat !== "All" && (
              <span className="mr-1">{CATEGORY_EMOJIS[cat] ?? ""}</span>
            )}
            {cat}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  seeAllTo,
  ocid,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  seeAllTo?: string;
  ocid: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5" data-ocid={ocid}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 text-accent shrink-0" />
        <h2 className="font-display font-bold text-lg text-foreground tracking-tight">
          {title}
        </h2>
        {count !== undefined && count > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border/40 px-1.5 py-0.5 rounded-sm tabular-nums">
            {count}
          </span>
        )}
      </div>
      {seeAllTo && (
        <Link
          to={seeAllTo}
          className="ml-auto shrink-0 flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors"
          data-ocid={`${ocid}_see_all_link`}
        >
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton key={i} className="h-56 rounded-lg" />
      ))}
    </div>
  );
}

function ArticleGrid({
  articles,
  startIndex = 0,
  ocid,
}: { articles: Article[]; startIndex?: number; ocid: string }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-ocid={ocid}
    >
      {articles.map((article, i) => (
        <ArticleCard
          key={article.id}
          article={article}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  headline,
  sub,
  cta,
  ocid,
}: {
  icon: React.ElementType;
  headline: string;
  sub: string;
  cta?: React.ReactNode;
  ocid: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 py-12 px-6 bg-muted/10 rounded-xl border border-border/30 text-center"
      data-ocid={ocid}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/40 border border-border/30">
        <Icon className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-1">{headline}</p>
        <p className="text-xs text-muted-foreground max-w-xs">{sub}</p>
      </div>
      {cta}
    </div>
  );
}

export function ArticleBrowserPage() {
  const { currentUserId, currentUser } = useUser();
  const { profile } = useUserProfile(currentUserId);
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: trendingArticles, isLoading: trendingLoading } =
    useTrending(10);
  const { data: recommendations, isLoading: recsLoading } = useRecommendations(
    currentUserId,
    "hybrid",
    undefined,
    8,
  );

  const featuredArticle = useMemo(() => {
    if (activeCategory !== "All") {
      return articles?.find((a) => a.category === activeCategory) ?? null;
    }
    return trendingArticles?.[0] ?? articles?.[0] ?? null;
  }, [trendingArticles, articles, activeCategory]);

  const trendingList = useMemo(() => {
    const all = trendingArticles ?? [];
    const filtered =
      activeCategory !== "All"
        ? all.filter((a) => a.category === activeCategory)
        : all;
    return filtered.filter((a) => a.id !== featuredArticle?.id).slice(0, 8);
  }, [trendingArticles, featuredArticle, activeCategory]);

  const filteredRecs = useMemo(() => {
    const recs = recommendations ?? [];
    const filtered =
      activeCategory !== "All"
        ? recs.filter((r) => r.article.category === activeCategory)
        : recs;
    return filtered.slice(0, 8).map((r) => r.article);
  }, [recommendations, activeCategory]);

  const interestArticles = useMemo(() => {
    const all = articles ?? [];
    const interests = profile?.interests ?? currentUser?.interests ?? [];
    if (!interests.length) {
      return activeCategory !== "All"
        ? all.filter((a) => a.category === activeCategory).slice(0, 8)
        : all.slice(0, 8);
    }
    return all
      .filter(
        (a) =>
          interests.includes(a.category) &&
          (activeCategory === "All" || a.category === activeCategory),
      )
      .slice(0, 8);
  }, [articles, profile, currentUser, activeCategory]);

  const hasPreferences = (profile?.interests?.length ?? 0) > 0;

  return (
    <Layout
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
    >
      {/* ── Hero ── */}
      <section
        className="bg-card border-b border-border/40 px-4 sm:px-6 pt-6 pb-4"
        data-ocid="hero.section"
      >
        {articlesLoading || trendingLoading ? (
          <Skeleton
            className="w-full h-[280px] sm:h-[300px] rounded-xl"
            data-ocid="hero.loading_state"
          />
        ) : featuredArticle ? (
          <HeroCard article={featuredArticle} />
        ) : null}
      </section>

      {/* ── Category strip ── */}
      <div
        className="sticky top-14 z-30 bg-card/95 backdrop-blur-sm border-b border-border/40 px-4 sm:px-6 py-3"
        data-ocid="category_strip.section"
      >
        <CategoryStrip active={activeCategory} onChange={setActiveCategory} />
      </div>

      <div className="px-4 sm:px-6 py-8 flex flex-col gap-12">
        {/* Recommended for You */}
        <section data-ocid="recommendations.section">
          <SectionHeader
            icon={Sparkles}
            title="Recommended for You"
            count={filteredRecs.length}
            ocid="recommendations.header"
          />
          {recsLoading || articlesLoading ? (
            <CardGridSkeleton count={8} />
          ) : filteredRecs.length > 0 ? (
            <ArticleGrid articles={filteredRecs} ocid="recommendations.list" />
          ) : (
            <EmptyState
              icon={BookOpen}
              headline="Keep reading to get personalized picks"
              sub="Your recommendation engine learns from every article you open. Start exploring to see tailored suggestions."
              ocid="recommendations.empty_state"
              cta={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-accent/40 text-accent hover:bg-accent/10"
                  onClick={() =>
                    document
                      .getElementById("trending-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  data-ocid="recommendations.browse_button"
                >
                  <Flame className="h-3.5 w-3.5" /> Browse Trending
                </Button>
              }
            />
          )}
        </section>

        {/* Trending Now */}
        <section
          id="trending-section"
          className="border-t border-border/30 pt-10"
          data-ocid="trending.section"
        >
          <SectionHeader
            icon={Flame}
            title="Trending Now"
            count={trendingList.length}
            ocid="trending.header"
          />
          {trendingLoading ? (
            <CardGridSkeleton count={8} />
          ) : trendingList.length > 0 ? (
            <ArticleGrid articles={trendingList} ocid="trending.list" />
          ) : (
            <EmptyState
              icon={Heart}
              headline="Start reading to see what's trending!"
              sub="Trending articles are ranked by reader interactions."
              ocid="trending.empty_state"
            />
          )}
        </section>

        {/* Based on Your Interests */}
        <section
          className="border-t border-border/30 pt-10"
          data-ocid="interests.section"
        >
          <SectionHeader
            icon={TrendingUp}
            title={
              hasPreferences
                ? "Based on Your Interests"
                : activeCategory !== "All"
                  ? `${activeCategory} Articles`
                  : "Explore by Category"
            }
            count={interestArticles.length}
            seeAllTo="/search"
            ocid="interests.header"
          />
          {articlesLoading ? (
            <CardGridSkeleton count={8} />
          ) : !hasPreferences ? (
            <EmptyState
              icon={Tag}
              headline="Select your interests to personalize this section"
              sub="Tell us which topics matter to you from your profile settings."
              ocid="interests.empty_state"
              cta={
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2 border-accent/40 text-accent hover:bg-accent/10"
                  data-ocid="interests.set_preferences_button"
                >
                  <Link to="/profile">
                    <Settings className="h-3.5 w-3.5" /> Set Preferences
                  </Link>
                </Button>
              }
            />
          ) : interestArticles.length > 0 ? (
            <ArticleGrid articles={interestArticles} ocid="interests.list" />
          ) : (
            <EmptyState
              icon={Newspaper}
              headline={
                activeCategory !== "All"
                  ? `No articles in "${activeCategory}"`
                  : "No articles available"
              }
              sub="Try a different category or check back soon."
              ocid="interests.empty_state"
              cta={
                activeCategory !== "All" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveCategory("All")}
                    className="text-xs text-accent hover:bg-accent/10"
                    data-ocid="interests.clear_filter_button"
                  >
                    Show all categories
                  </Button>
                ) : undefined
              }
            />
          )}
        </section>
      </div>
    </Layout>
  );
}
