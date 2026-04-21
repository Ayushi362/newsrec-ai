import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { useArticles } from "@/hooks/useArticles";
import { useLikes } from "@/hooks/useLikes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { CATEGORIES, CATEGORY_COLORS, REGIONS } from "@/types";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Heart,
  ListOrdered,
  MapPin,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function avatarColor(name: string): string {
  const palette = [
    "bg-accent text-accent-foreground",
    "bg-primary text-primary-foreground",
    "bg-chart-2 text-foreground",
    "bg-chart-3 text-foreground",
    "bg-chart-4 text-foreground",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function StatCard({
  icon,
  label,
  value,
  ocid,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  ocid: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 bg-card border border-border rounded-lg px-4 py-3"
      data-ocid={ocid}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-accent">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="metric-value text-xl">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const { currentUserId, currentUser } = useUser();
  const { profile, isLoading, updateProfile, isUpdating } =
    useUserProfile(currentUserId);
  const articlesQuery = useArticles();
  const articles = articlesQuery.data ?? [];
  const { likedArticles } = useLikes(currentUserId);

  const [displayName, setDisplayName] = useState(currentUser?.name ?? "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [region, setRegion] = useState(currentUser?.region ?? "");
  const [interests, setInterests] = useState<string[]>(
    currentUser?.interests ?? [],
  );
  const [feedPriorities, setFeedPriorities] = useState<string[]>([]);
  const [readHistory, setReadHistory] = useState<string[]>(
    currentUser?.readHistory ?? [],
  );
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name);
      setRegion(profile.region);
      setInterests(profile.interests);
      setReadHistory(profile.readHistory);
    }
  }, [profile]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("")
    : currentUserId.slice(0, 2).toUpperCase();

  const toggleInterest = (cat: string) => {
    setInterests((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length < 7
          ? [...prev, cat]
          : prev,
    );
  };

  const toggleFeedPriority = (cat: string) => {
    setFeedPriorities((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length < 3
          ? [...prev, cat]
          : prev,
    );
  };

  const movePriority = (index: number, dir: -1 | 1) => {
    const next = [...feedPriorities];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFeedPriorities(next);
  };

  const saveNameInline = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    setIsEditingName(false);
    updateProfile({ name: displayName.trim() });
    toast.success("Display name updated!");
  };

  const saveRegion = () => {
    updateProfile({ region });
    toast.success("Region updated!");
  };

  const saveInterests = () => {
    updateProfile({ interests });
    toast.success("Interests saved!");
  };

  const clearHistory = () => {
    setReadHistory([]);
    toast.success("Reading history cleared.");
  };

  const articleMap = new Map(articles.map((a) => [a.id, a]));
  const likedCount = likedArticles.length;

  if (isLoading) {
    return (
      <Layout showSidebar={false}>
        <div
          className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6"
          data-ocid="profile.loading_state"
        >
          <div className="flex items-center gap-5">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8"
        data-ocid="profile.page"
      >
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-xl shrink-0 ${avatarColor(displayName || currentUserId)}`}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={nameInputRef}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveNameInline();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    className="h-8 text-lg font-bold font-display w-48 sm:w-64"
                    data-ocid="profile.displayname_input"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-accent"
                    onClick={saveNameInline}
                    disabled={isUpdating}
                    aria-label="Save name"
                    data-ocid="profile.save_name_button"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => setIsEditingName(false)}
                    aria-label="Cancel edit"
                    data-ocid="profile.cancel_name_button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="font-display font-bold text-2xl text-foreground truncate">
                    {displayName || currentUserId}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-smooth"
                    aria-label="Edit display name"
                    data-ocid="profile.edit_name_button"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-muted-foreground/60">
                {currentUserId}
              </span>
              {region && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[11px] border-accent/30 text-accent"
                  data-ocid="profile.region_badge"
                >
                  <MapPin className="h-2.5 w-2.5" />
                  {region}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className="grid grid-cols-3 gap-3"
          data-ocid="profile.stats_section"
        >
          <StatCard
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Articles Read"
            value={readHistory.length}
            ocid="profile.stat_read"
          />
          <StatCard
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Liked"
            value={likedCount}
            ocid="profile.stat_liked"
          />
          <StatCard
            icon={<Star className="h-3.5 w-3.5" />}
            label="Interests"
            value={interests.length}
            ocid="profile.stat_interests"
          />
        </div>

        {/* Region */}
        <section
          className="bg-card border border-border rounded-xl p-6 space-y-4"
          data-ocid="profile.region_section"
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-base text-foreground">
              Region
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Your region personalizes local news and trending topics.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1 max-w-xs">
              <Label
                htmlFor="region-select"
                className="text-xs text-muted-foreground mb-1.5 block"
              >
                Select region
              </Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger
                  id="region-select"
                  className="h-10"
                  data-ocid="profile.region_select"
                >
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={saveRegion}
              disabled={isUpdating}
              data-ocid="profile.save_region_button"
            >
              Save
            </Button>
          </div>
        </section>

        {/* Interests */}
        <section
          className="bg-card border border-border rounded-xl p-6 space-y-4"
          data-ocid="profile.interests_section"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Interests
              </h2>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {interests.length}/7 selected
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle topics you care about. Selecting up to 7 shapes your
            personalized feed.
          </p>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
            data-ocid="profile.interests_grid"
          >
            {CATEGORIES.map((cat) => {
              const active = interests.includes(cat);
              const disabled = !active && interests.length >= 7;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleInterest(cat)}
                  disabled={disabled}
                  className={[
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-accent/10 border-accent/50 text-accent"
                      : "bg-muted/20 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer",
                  ].join(" ")}
                  data-ocid={`profile.interest_${cat.toLowerCase()}_toggle`}
                  aria-pressed={active}
                >
                  {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {cat}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <Button
              size="sm"
              onClick={saveInterests}
              disabled={isUpdating}
              data-ocid="profile.save_interests_button"
            >
              Save Interests
            </Button>
          </div>
        </section>

        {/* Feed Priorities */}
        <section
          className="bg-card border border-border rounded-xl p-6 space-y-4"
          data-ocid="profile.feed_priorities_section"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-accent" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Feed Priorities
              </h2>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {feedPriorities.length}/3 selected
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Choose up to 3 categories that get extra weight in your
            recommendations.
          </p>

          {feedPriorities.length > 0 && (
            <div
              className="flex flex-col gap-1.5 mb-3"
              data-ocid="profile.priorities_list"
            >
              {feedPriorities.map((cat, idx) => (
                <div
                  key={cat}
                  className="flex items-center gap-3 bg-muted/20 border border-border/30 rounded-lg px-3 py-2"
                  data-ocid={`profile.priority_item.${idx + 1}`}
                >
                  <span className="text-xs font-mono text-muted-foreground w-4 shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className={`badge-category shrink-0 ${CATEGORY_COLORS[cat] ?? ""}`}
                  >
                    {cat}
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {cat}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => movePriority(idx, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-smooth disabled:opacity-30"
                      aria-label={`Move ${cat} up`}
                      data-ocid={`profile.priority_up.${idx + 1}`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePriority(idx, 1)}
                      disabled={idx === feedPriorities.length - 1}
                      className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-smooth disabled:opacity-30"
                      aria-label={`Move ${cat} down`}
                      data-ocid={`profile.priority_down.${idx + 1}`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFeedPriority(cat)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth"
                      aria-label={`Remove ${cat}`}
                      data-ocid={`profile.priority_remove.${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const active = feedPriorities.includes(cat);
              const disabled = !active && feedPriorities.length >= 3;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleFeedPriority(cat)}
                  disabled={disabled}
                  className={[
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-muted/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "cursor-pointer",
                  ].join(" ")}
                  data-ocid={`profile.feedpriority_${cat.toLowerCase()}_toggle`}
                  aria-pressed={active}
                >
                  {active && <Check className="h-3 w-3 shrink-0" />}
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <Button
              size="sm"
              onClick={() => toast.success("Feed priorities saved!")}
              disabled={isUpdating}
              data-ocid="profile.save_priorities_button"
            >
              Save Priorities
            </Button>
          </div>
        </section>

        {/* Reading History */}
        <section
          className="bg-card border border-border rounded-xl p-6 space-y-4"
          data-ocid="profile.history_section"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <h2 className="font-display font-semibold text-base text-foreground">
                Reading History
              </h2>
              <Badge variant="secondary" className="text-xs">
                {readHistory.length}
              </Badge>
            </div>
            {readHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                data-ocid="profile.clear_history_button"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear History
              </Button>
            )}
          </div>

          {readHistory.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-10 text-center"
              data-ocid="profile.history_empty_state"
            >
              <BookOpen className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No reading history yet. Start exploring articles!
              </p>
              <Link to="/" data-ocid="profile.browse_articles_link">
                <Button variant="outline" size="sm">
                  Browse Articles
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className="flex flex-col divide-y divide-border/40"
              data-ocid="profile.history_list"
            >
              {readHistory.map((id, idx) => {
                const article = articleMap.get(id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 py-3"
                    data-ocid={`profile.history_item.${idx + 1}`}
                  >
                    <span className="text-xs text-muted-foreground/60 font-mono w-5 shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {article ? (
                        <Link
                          to="/articles/$id"
                          params={{ id }}
                          className="block group/link"
                          data-ocid={`profile.history_link.${idx + 1}`}
                        >
                          <span className="text-sm font-medium text-foreground group-hover/link:text-accent transition-smooth truncate block">
                            {article.title}
                          </span>
                          <span
                            className={`badge-category text-[10px] ${CATEGORY_COLORS[article.category] ?? ""}`}
                          >
                            {article.category}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Article #{id}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
