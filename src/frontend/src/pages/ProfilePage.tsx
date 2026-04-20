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
import { useAuth } from "@/context/AuthContext";
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
  Clock,
  Edit2,
  Heart,
  ListOrdered,
  Lock,
  MapPin,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────
// Sign-in gate
// ──────────────────────────────────────────────────────────────
function AuthGate({ login }: { login: () => void }) {
  return (
    <Layout showSidebar={false}>
      <div
        className="max-w-lg mx-auto px-4 py-28 flex flex-col items-center gap-6 text-center"
        data-ocid="profile.auth_gate"
      >
        <div className="w-18 h-18 rounded-full bg-muted/40 border border-border/40 flex items-center justify-center p-5">
          <Lock className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">
            Sign in to view your profile
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your personalized reading history, preferences, and feed settings
            are securely tied to your Internet Identity.
          </p>
        </div>
        <Button
          onClick={login}
          size="lg"
          className="gap-2 px-8"
          data-ocid="profile.login_button"
        >
          Sign In with Internet Identity
        </Button>
      </div>
    </Layout>
  );
}

// ──────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { isAuthenticated, identity, login } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useUserProfile();
  const articlesQuery = useArticles();
  const articles = articlesQuery.data ?? [];
  const { likedArticles } = useLikes();

  // ── form state ──
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [region, setRegion] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [feedPriorities, setFeedPriorities] = useState<string[]>([]);
  const [localHistory, setLocalHistory] = useState<bigint[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── populate form when profile loads ──
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setRegion(profile.region);
      setInterests(profile.interests);
      setFeedPriorities(profile.preferredCategories.slice(0, 3));
      setLocalHistory([...profile.readingHistory].slice(0, 20));
    }
  }, [profile]);

  // ── focus name input when entering edit mode ──
  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  if (!isAuthenticated) return <AuthGate login={login} />;

  // ── helpers ──
  const shortId = identity
    ? `${identity.slice(0, 8)}…${identity.slice(-5)}`
    : "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("")
    : "?";

  // ── interactions ──
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

  const clearHistory = () => {
    setLocalHistory([]);
    updateProfile(
      { preferredCategories: feedPriorities, interests },
      {
        onSuccess: () => toast.success("Reading history cleared."),
        onError: () => toast.error("Failed to clear history."),
      },
    );
  };

  const saveNameInline = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    setIsEditingName(false);
    updateProfile(
      { displayName: displayName.trim() },
      {
        onSuccess: () => toast.success("Display name updated!"),
        onError: () => toast.error("Failed to update display name."),
      },
    );
  };

  const saveRegion = () => {
    updateProfile(
      { region },
      {
        onSuccess: () => toast.success("Region updated!"),
        onError: () => toast.error("Failed to update region."),
      },
    );
  };

  const saveInterests = () => {
    updateProfile(
      { interests },
      {
        onSuccess: () => toast.success("Interests saved!"),
        onError: () => toast.error("Failed to save interests."),
      },
    );
  };

  const saveFeedPriorities = () => {
    updateProfile(
      { preferredCategories: feedPriorities },
      {
        onSuccess: () => toast.success("Feed priorities saved!"),
        onError: () => toast.error("Failed to save feed priorities."),
      },
    );
  };

  // article lookup map for history
  const articleMap = new Map(articles.map((a) => [a.id.toString(), a]));

  // liked articles count — from useLikes hook
  const likedCount = likedArticles.length;

  // ──────────────────────────────────────────────────────────────
  // Loading state
  // ──────────────────────────────────────────────────────────────
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
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
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
        {/* ── PROFILE HEADER ──────────────────────────────── */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-xl shrink-0 ${avatarColor(displayName || "user")}`}
            aria-label="Profile avatar"
          >
            {initials}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            {/* Inline editable name */}
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
                    {displayName || "Anonymous"}
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
              <span className="font-mono">{shortId}</span>
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
              {profile?.createdAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Member since {formatDate(profile.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ──────────────────────────────────── */}
        <div
          className="grid grid-cols-3 gap-3"
          data-ocid="profile.stats_section"
        >
          <StatCard
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Articles Read"
            value={profile?.readingHistory.length ?? 0}
            ocid="profile.stat_read"
          />
          <StatCard
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Liked"
            value={likedCount}
            ocid="profile.stat_liked"
          />
          <StatCard
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Member Since"
            value={
              profile?.createdAt
                ? new Date(Number(profile.createdAt / 1_000_000n))
                    .getFullYear()
                    .toString()
                : "—"
            }
            ocid="profile.stat_since"
          />
        </div>

        {/* ── REGION ────────────────────────────────────── */}
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

        {/* ── INTERESTS ──────────────────────────────────── */}
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

        {/* ── FEED PRIORITIES ───────────────────────────── */}
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
            recommendations. Use the arrows to set priority order.
          </p>

          {/* Ordered list of selected priorities */}
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
                      aria-label={`Remove ${cat} from priorities`}
                      data-ocid={`profile.priority_remove.${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category toggles */}
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
              onClick={saveFeedPriorities}
              disabled={isUpdating}
              data-ocid="profile.save_priorities_button"
            >
              Save Priorities
            </Button>
          </div>
        </section>

        {/* ── READING HISTORY ───────────────────────────── */}
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
                {localHistory.length}
              </Badge>
            </div>
            {localHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                disabled={isUpdating}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                data-ocid="profile.clear_history_button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear History
              </Button>
            )}
          </div>

          {localHistory.length === 0 ? (
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
              {localHistory.map((id, idx) => {
                const article = articleMap.get(id.toString());
                return (
                  <div
                    key={id.toString()}
                    className="flex items-center gap-3 py-3 group"
                    data-ocid={`profile.history_item.${idx + 1}`}
                  >
                    <span className="text-xs text-muted-foreground/60 font-mono w-5 shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {article ? (
                        <Link
                          to="/articles/$id"
                          params={{ id: id.toString() }}
                          className="block group/link"
                          data-ocid={`profile.history_link.${idx + 1}`}
                        >
                          <span className="text-sm font-medium text-foreground group-hover/link:text-accent transition-smooth truncate block">
                            {article.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`badge-category text-[10px] ${CATEGORY_COLORS[article.category] ?? ""}`}
                            >
                              {article.category}
                            </span>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Article #{id.toString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── DANGER / ACCOUNT ─────────────────────────── */}
        <div className="flex justify-end pb-4">
          <p className="text-xs text-muted-foreground/60">
            Profile data is stored on the Internet Computer, tied to your
            identity.
          </p>
        </div>
      </div>
    </Layout>
  );
}
