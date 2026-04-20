import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useArticles } from "@/hooks/useArticles";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useTrending } from "@/hooks/useTrending";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AlgorithmSource, type Article, CATEGORIES } from "@/types";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Flame,
  Heart,
  LogIn,
  Newspaper,
  Settings,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

// ── Category gradient map ───────────────────────────────────────────────────
const CATEGORY_GRADIENTS: Record<string, string> = {
  Technology: "from-accent/40 via-accent/15 to-transparent",
  Business: "from-chart-3/40 via-chart-3/15 to-transparent",
  Health: "from-chart-5/40 via-chart-5/15 to-transparent",
  Science: "from-chart-2/40 via-chart-2/15 to-transparent",
  World: "from-muted/60 via-muted/25 to-transparent",
  Sports: "from-primary/40 via-primary/15 to-transparent",
  Entertainment: "from-chart-4/40 via-chart-4/15 to-transparent",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Technology: "💻",
  Business: "📈",
  Health: "🏥",
  Science: "🔬",
  World: "🌍",
  Sports: "⚽",
  Entertainment: "🎬",
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  Technology: "bg-accent/20 text-accent border-accent/30",
  Business: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  Health: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  Science: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  World: "bg-muted text-muted-foreground border-border",
  Sports: "bg-primary/20 text-primary border-primary/30",
  Entertainment: "bg-chart-4/20 text-chart-4 border-chart-4/30",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(id: bigint): string {
  // Approximate based on article id — lower ids are older
  const hours = Number(id % BigInt(72)) + 1;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getExcerpt(content: string, maxLen = 140): string {
  if (content.length <= maxLen) return content;
  return `${content.slice(0, maxLen).trimEnd()}…`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

/** Full-width hero card for the featured article */
function HeroCard({ article }: { article: Article }) {
  const navigate = useNavigate();
  const gradient =
    CATEGORY_GRADIENTS[article.category] ??
    "from-muted/60 via-muted/25 to-transparent";
  const badgeColor =
    CATEGORY_BADGE_COLORS[article.category] ??
    "bg-muted text-muted-foreground border-border";
  const emoji = CATEGORY_EMOJIS[article.category] ?? "📰";

  const goToArticle = () =>
    void navigate({
      to: "/articles/$id",
      params: { id: article.id.toString() },
    });

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card shadow-md group"
      data-ocid="hero.card"
    >
      {/* Visual background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`}
      />
      {/* Dark gradient overlay at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/30 to-transparent pointer-events-none" />

      {/* Large emoji accent */}
      <div
        className="absolute top-6 right-8 text-8xl opacity-20 select-none pointer-events-none"
        aria-hidden="true"
      >
        {emoji}
      </div>

      {/* Clickable overlay — covers full card except Read button */}
      <button
        type="button"
        className="absolute inset-0 z-[5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        onClick={goToArticle}
        aria-label={`Read article: ${article.title}`}
      />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-4 min-h-[260px] sm:min-h-[300px] justify-end pointer-events-none">
        <div className="flex items-center gap-2">
          <Badge
            className={`text-[10px] font-mono font-semibold uppercase tracking-wider border px-2.5 py-0.5 rounded-sm ${badgeColor}`}
          >
            {article.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono">
            {timeAgo(article.id)}
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

/** Horizontal scrollable category chip strip */
function CategoryStrip({
  active,
  onChange,
}: {
  active: string;
  onChange: (cat: string) => void;
}) {
  const all = ["All", ...CATEGORIES];
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="tablist"
      aria-label="Filter by category"
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
              <span className="mr-1" aria-hidden="true">
                {CATEGORY_EMOJIS[cat] ?? ""}
              </span>
            )}
            {cat}
          </button>
        );
      })}
    </div>
  );
}

/** Section header with icon, title, count, and optional "See all" link */
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
        <Icon className="h-4.5 w-4.5 text-accent shrink-0" />
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

/** Skeleton grid used while loading */
function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
        <Skeleton key={i} className="h-44 rounded-lg" />
      ))}
    </div>
  );
}

/** Standard article card grid */
function ArticleGrid({
  articles,
  startIndex = 0,
  ocid,
}: {
  articles: Article[];
  startIndex?: number;
  ocid: string;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      data-ocid={ocid}
    >
      {articles.map((article, i) => (
        <ArticleCard
          key={article.id.toString()}
          article={article}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}

/** Empty state block */
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

// ── Main Page ────────────────────────────────────────────────────────────────

export function ArticleBrowserPage() {
  const { isAuthenticated, login } = useAuth();
  const { profile } = useUserProfile();
  const [activeCategory, setActiveCategory] = useState("All");

  // Data fetching
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: trendingArticles, isLoading: trendingLoading } =
    useTrending(10);
  const userId = isAuthenticated ? (profile?.principalText ?? "me") : "";
  const { data: recResponse, isLoading: recsLoading } = useRecommendations(
    userId,
    AlgorithmSource.hybrid,
    undefined,
    8,
  );

  // Featured article: first trending or first article
  const featuredArticle = useMemo(() => {
    if (activeCategory !== "All") {
      return articles?.find((a) => a.category === activeCategory) ?? null;
    }
    return trendingArticles?.[0] ?? articles?.[0] ?? null;
  }, [trendingArticles, articles, activeCategory]);

  // Trending list (exclude hero)
  const trendingList = useMemo(() => {
    const all = trendingArticles ?? [];
    const filtered =
      activeCategory !== "All"
        ? all.filter((a) => a.category === activeCategory)
        : all;
    const heroId = featuredArticle?.id;
    return filtered.filter((a) => a.id !== heroId).slice(0, 8);
  }, [trendingArticles, featuredArticle, activeCategory]);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = recResponse?.recommendations ?? [];
    const filtered =
      activeCategory !== "All"
        ? recs.filter((r) => r.article.category === activeCategory)
        : recs;
    return filtered.slice(0, 8).map((r) => r.article);
  }, [recResponse, activeCategory]);

  // Fallback popular articles for anonymous rec section
  const popularFallback = useMemo(() => {
    const all = articles ?? [];
    const filtered =
      activeCategory !== "All"
        ? all.filter((a) => a.category === activeCategory)
        : all;
    return filtered.slice(0, 8);
  }, [articles, activeCategory]);

  // Interests section: auth → preferred categories, anon → group by category
  const interestArticles = useMemo(() => {
    const all = articles ?? [];
    if (!isAuthenticated || !profile) {
      // Anonymous: show first 3 per popular category, flatten
      const groups: Article[] = [];
      const usedCats = new Set<string>();
      for (const a of all) {
        if (usedCats.size >= 4) break;
        if (!usedCats.has(a.category)) usedCats.add(a.category);
      }
      for (const cat of usedCats) {
        const catArticles = all.filter((a) => a.category === cat).slice(0, 3);
        groups.push(...catArticles);
      }
      return activeCategory !== "All"
        ? all.filter((a) => a.category === activeCategory).slice(0, 8)
        : groups.slice(0, 8);
    }
    const preferred = profile.preferredCategories;
    if (!preferred.length) return [];
    const filtered = all.filter(
      (a) =>
        preferred.includes(a.category) &&
        (activeCategory === "All" || a.category === activeCategory),
    );
    return filtered.slice(0, 8);
  }, [articles, isAuthenticated, profile, activeCategory]);

  const hasPreferences = (profile?.preferredCategories?.length ?? 0) > 0;

  return (
    <Layout
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
    >
      {/* ── Hero ──────────────────────────────────────────── */}
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

      {/* ── Category filter strip ─────────────────────────── */}
      <div
        className="sticky top-14 z-30 bg-card/95 backdrop-blur-sm border-b border-border/40 px-4 sm:px-6 py-3"
        data-ocid="category_strip.section"
      >
        <CategoryStrip active={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* ── Page body ─────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-8 flex flex-col gap-12">
        {/* ── Section 1: Recommended for You ─────────────── */}
        <section data-ocid="recommendations.section">
          <SectionHeader
            icon={Sparkles}
            title="Recommended for You"
            count={
              recommendations.length ||
              (isAuthenticated ? 0 : popularFallback.length)
            }
            ocid="recommendations.header"
          />

          {recsLoading || articlesLoading ? (
            <CardGridSkeleton count={8} />
          ) : isAuthenticated ? (
            recommendations.length > 0 ? (
              <ArticleGrid
                articles={recommendations}
                ocid="recommendations.list"
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                headline="Read some articles to get personalized picks"
                sub="Your recommendation engine learns from every article you open. Start exploring to see tailored suggestions here."
                ocid="recommendations.empty_state"
                cta={
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-accent/40 text-accent hover:bg-accent/10"
                    onClick={() => {
                      document
                        .getElementById("trending-section")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    data-ocid="recommendations.browse_button"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Browse Trending
                  </Button>
                }
              />
            )
          ) : (
            /* Anonymous: sign-in prompt + popular articles */
            <div className="flex flex-col gap-6">
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-accent/5 border border-accent/20 rounded-xl"
                data-ocid="recommendations.signin_prompt"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 border border-accent/30 shrink-0">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Get personalized recommendations
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sign in to unlock AI-powered picks tailored to your
                      reading habits.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={login}
                  className="shrink-0 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                  data-ocid="recommendations.login_button"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </div>

              {popularFallback.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-mono mb-4 uppercase tracking-wider">
                    Popular right now
                  </p>
                  <ArticleGrid
                    articles={popularFallback}
                    ocid="recommendations.popular_list"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Section 2: Trending Now ─────────────────────── */}
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
              headline="Be the first to interact — start reading!"
              sub="Trending articles are ranked by reader interactions. Open an article, like it, and watch it rise here."
              ocid="trending.empty_state"
            />
          )}
        </section>

        {/* ── Section 3: Based on Your Interests ──────────── */}
        <section
          className="border-t border-border/30 pt-10"
          data-ocid="interests.section"
        >
          <SectionHeader
            icon={TrendingUp}
            title={
              isAuthenticated && hasPreferences
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
          ) : isAuthenticated && !hasPreferences ? (
            /* Auth but no preferences set */
            <EmptyState
              icon={Tag}
              headline="Select your interests to personalize this section"
              sub="Tell us which topics matter to you. We'll curate a feed that matches what you love to read."
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
                    <Settings className="h-3.5 w-3.5" />
                    Set Preferences
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
                  ? `No articles found in "${activeCategory}"`
                  : "No articles available yet"
              }
              sub={
                activeCategory !== "All"
                  ? "Try a different category or check back soon for fresh content."
                  : "Articles will appear here once they're published."
              }
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
