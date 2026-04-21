import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useMetrics } from "@/hooks/useMetrics";
import { useRecommendations } from "@/hooks/useRecommendations";
import {
  Activity,
  BarChart3,
  Brain,
  Cpu,
  FileText,
  Layers,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import type React from "react";

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
  index: number;
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent,
  index,
}: MetricCardProps) {
  return (
    <div
      className={`bg-card border rounded-md p-5 flex flex-col gap-3 ${accent ? "border-accent/40 bg-accent/5" : "border-border/50"}`}
      data-ocid={`metric_card.item.${index}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={`h-3.5 w-3.5 ${accent ? "text-accent" : "text-muted-foreground"}`}
        />
      </div>
      <div
        className={`text-2xl font-bold font-display tabular-nums ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        {description}
      </p>
    </div>
  );
}

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.min(Math.round(score * 100), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold font-mono tabular-nums text-accent w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

const ALGO_CARDS = [
  {
    title: "Content-Based Filtering",
    icon: Cpu,
    color: "border-accent/30 bg-accent/5",
    textColor: "text-accent",
    desc: "Analyzes article text using TF-IDF vectorization, then measures cosine similarity to surface semantically related content. Articles sharing rare key terms score higher.",
    badge: "TF-IDF + Cosine",
    steps: [
      "Tokenize + stem text",
      "Build TF-IDF vectors",
      "Compute cosine similarity",
      "Return top-N matches",
    ],
  },
  {
    title: "Collaborative Filtering",
    icon: Users,
    color: "border-primary/30 bg-primary/5",
    textColor: "text-primary",
    desc: "Builds a user-item interaction matrix from click and like events. Finds users with similar reading patterns and recommends articles those users engaged with.",
    badge: "User-Item Matrix",
    steps: [
      "Record interactions",
      "Build user vectors",
      "Compute user similarity",
      "Aggregate preferences",
    ],
  },
  {
    title: "Hybrid Approach",
    icon: Layers,
    color: "border-chart-3/30 bg-chart-3/5",
    textColor: "text-chart-3",
    desc: "Blends content (45%) and collaborative (35%) signals with a popularity boost (20%). Addresses cold-start for new users while leveraging social proof as data grows.",
    badge: "Weighted Blend",
    steps: [
      "Score both methods",
      "Normalize scores",
      "Weighted combination",
      "Re-rank output",
    ],
  },
] as const;

export function MetricsDashboardPage() {
  const { currentUserId } = useUser();
  const { data: metrics, isLoading, isError } = useMetrics();

  const { data: userRecs, isLoading: historyLoading } = useRecommendations(
    currentUserId,
    "collaborative",
    undefined,
    8,
  );

  const metricCards: (Omit<MetricCardProps, "index"> & { key: string })[] =
    metrics
      ? [
          {
            key: "articles",
            label: "Total Articles",
            value: metrics.totalArticles.toString(),
            description:
              "Articles indexed and available for recommendation via TF-IDF vectors",
            icon: FileText,
          },
          {
            key: "users",
            label: "Total Users",
            value: metrics.totalUsers.toString(),
            description:
              "Demo users tracked in the collaborative filtering model",
            icon: Users,
          },
          {
            key: "interactions",
            label: "Total Interactions",
            value: metrics.totalInteractions.toString(),
            description:
              "Clicks and likes recorded; drives the user-item interaction matrix",
            icon: Activity,
            accent: true,
          },
          {
            key: "coverage",
            label: "Rec. Coverage",
            value: `${Math.round(metrics.recommendationCoverage * 100)}%`,
            description:
              "Percentage of the article catalog reachable through recommendations",
            icon: Percent,
          },
        ]
      : [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Header */}
        <div
          className="flex items-center justify-between gap-4"
          data-ocid="metrics.section"
        >
          <div className="flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-accent" />
            <div>
              <h1 className="font-display font-bold text-lg text-foreground leading-none">
                Recommendation Metrics
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Live system performance and algorithm analysis
              </p>
            </div>
            <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/25 px-1.5 py-0.5 rounded-sm">
              Live
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            {currentUserId}
          </span>
        </div>

        {isLoading ? (
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            data-ocid="metrics.loading_state"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
              <Skeleton key={i} className="h-32 rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center gap-2 py-12 bg-destructive/5 rounded-md border border-destructive/20"
            data-ocid="metrics.error_state"
          >
            <p className="text-xs text-destructive">Failed to load metrics.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metricCards.map(({ key, ...card }, i) => (
                <MetricCard key={key} {...card} index={i + 1} />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border/50 rounded-md p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-accent" />
                  <h2 className="font-display font-semibold text-sm text-foreground">
                    Avg. Cosine Similarity Score
                  </h2>
                </div>
                <SimilarityBar score={metrics?.averageSimilarityScore ?? 0} />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Measures how closely related recommended articles are on
                  average, based on TF-IDF vector dot products.
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-md p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  <h2 className="font-display font-semibold text-sm text-foreground">
                    Recommendation Coverage
                  </h2>
                </div>
                <SimilarityBar score={metrics?.recommendationCoverage ?? 0} />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Fraction of the total article catalog that appears in at least
                  one user's recommendation set.
                </p>
              </div>
            </div>

            {/* Algorithm breakdown */}
            <div>
              <h2 className="font-display font-semibold text-sm text-foreground mb-4">
                Algorithm Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ALGO_CARDS.map(
                  (
                    { title, icon: Icon, color, textColor, desc, badge, steps },
                    i,
                  ) => (
                    <div
                      key={title}
                      className={`border rounded-md p-5 flex flex-col gap-4 ${color}`}
                      data-ocid={`algo_card.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${textColor}`} />
                          <h3
                            className={`text-xs font-semibold font-display ${textColor}`}
                          >
                            {title}
                          </h3>
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 border rounded-sm ${color} ${textColor} shrink-0`}
                        >
                          {badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {desc}
                      </p>
                      <div className="flex flex-col gap-1 mt-auto">
                        {steps.map((s, si) => (
                          <div key={s} className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono tabular-nums font-bold ${textColor} opacity-60`}
                            >
                              {si + 1}.
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {s}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* User interaction history */}
            <div data-ocid="user_history.section">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-semibold text-sm text-foreground">
                  Personalized For
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded-sm">
                  {currentUserId}
                </span>
              </div>

              {historyLoading ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                  data-ocid="user_history.loading_state"
                >
                  {Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-40 rounded-md" />
                  ))}
                </div>
              ) : (userRecs ?? []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(userRecs ?? []).map((result, i) => (
                    <ArticleCard
                      key={result.article.id}
                      article={result.article}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center gap-3 py-10 bg-muted/10 rounded-md border border-border/30"
                  data-ocid="user_history.empty_state"
                >
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground text-center max-w-sm">
                    No interactions yet for{" "}
                    <span className="font-mono text-foreground">
                      {currentUserId}
                    </span>
                    . Browse and read articles to build your profile.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
