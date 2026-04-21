import { ArticleCard } from "@/components/ArticleCard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch, useSearchHistory } from "@/hooks/useSearch";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/types";
import {
  useNavigate,
  useSearch as useRouterSearch,
} from "@tanstack/react-router";
import { Clock, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SORT_OPTIONS = ["Relevance", "Latest"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const SUGGESTED_SEARCHES = [
  "Artificial Intelligence",
  "Business",
  "Climate Change",
  "Space Exploration",
  "Olympic Games",
  "Healthcare",
  "Economy",
  "Nuclear Fusion",
];

export function SearchPage() {
  const { q: urlQuery, category: urlCategory } = useRouterSearch({
    from: "/search",
  });
  const navigate = useNavigate();
  const { recordSearch } = useStore();

  const [inputValue, setInputValue] = useState(urlQuery ?? "");
  const [activeCategory, setActiveCategory] = useState<string>(
    urlCategory ?? "",
  );
  const [sortBy, setSortBy] = useState<SortOption>("Relevance");
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedRef = useRef<string>("");

  const { history } = useSearchHistory();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    if (urlQuery !== undefined) setInputValue(urlQuery);
    if (urlCategory !== undefined) setActiveCategory(urlCategory);
  }, [urlQuery, urlCategory]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length >= 2 && trimmed !== hasRecordedRef.current) {
      hasRecordedRef.current = trimmed;
      recordSearch(trimmed);
    }
  }, [debouncedQuery, recordSearch]);

  const { data: rawResults, isLoading } = useSearch(
    debouncedQuery,
    activeCategory || undefined,
  );

  const results = useMemo(() => {
    if (!rawResults) return [];
    if (sortBy === "Latest") {
      return [...rawResults].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
    }
    return rawResults;
  }, [rawResults, sortBy]);

  const handleCategoryClick = useCallback(
    (cat: string) => {
      const next = activeCategory === cat ? "" : cat;
      setActiveCategory(next);
      void navigate({
        to: "/search",
        search: { q: inputValue, category: next },
      });
    },
    [activeCategory, inputValue, navigate],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      setDebouncedQuery(trimmed);
      void navigate({
        to: "/search",
        search: { q: trimmed, category: activeCategory },
      });
      if (trimmed.length >= 2) {
        hasRecordedRef.current = trimmed;
        recordSearch(trimmed);
      }
    },
    [inputValue, activeCategory, navigate, recordSearch],
  );

  const handleHistoryClick = useCallback(
    (term: string) => {
      setInputValue(term);
      setDebouncedQuery(term);
      void navigate({
        to: "/search",
        search: { q: term, category: activeCategory },
      });
    },
    [activeCategory, navigate],
  );

  const handleClearSearch = useCallback(() => {
    setInputValue("");
    setDebouncedQuery("");
    void navigate({ to: "/search", search: { q: "", category: "" } });
  }, [navigate]);

  const recentSearches = history.slice(0, 10);
  const hasQuery = debouncedQuery.trim().length >= 1;
  const hasResults = results.length > 0;

  return (
    <Layout showSidebar={false}>
      {/* Hero search bar */}
      <div className="hero-section">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-5 w-5 text-accent" />
            <h1
              className="font-display font-bold text-xl text-foreground"
              data-ocid="search.page"
            >
              Search Articles
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Find news across all categories. Your searches shape your
            recommendations.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by keyword, topic, or category…"
                className="w-full h-12 pl-10 pr-10 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-foreground placeholder:text-muted-foreground transition-smooth"
                aria-label="Search articles"
                data-ocid="search.search_input"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  data-ocid="search.clear_button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={activeCategory}
                onChange={(e) => {
                  setActiveCategory(e.target.value);
                  void navigate({
                    to: "/search",
                    search: { q: inputValue, category: e.target.value },
                  });
                }}
                className="h-12 pl-3 pr-8 text-sm bg-background border border-input rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
                aria-label="Filter by category"
                data-ocid="search.category_select"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>

            <Button
              type="submit"
              className="h-12 px-5 font-semibold"
              data-ocid="search.submit_button"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Category chips */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <button
              type="button"
              onClick={() => handleCategoryClick("")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-smooth border whitespace-nowrap ${activeCategory === "" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}
              data-ocid="search.category_chip.all"
            >
              All
            </button>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-smooth border whitespace-nowrap ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}
                data-ocid={`search.category_chip.${i + 1}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="feed-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {!hasQuery ? (
                <div
                  className="flex flex-col items-center py-12 text-center gap-6"
                  data-ocid="search.idle_state"
                >
                  <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Sparkles className="h-9 w-9 text-accent/60" />
                  </div>
                  <div>
                    <p className="text-base font-display font-semibold text-foreground mb-1">
                      Discover your next read
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Type a keyword above to search across all articles.
                    </p>
                  </div>
                  <div className="w-full max-w-sm">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-3">
                      Try searching for
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {SUGGESTED_SEARCHES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleHistoryClick(s)}
                          className="px-3.5 py-1.5 text-xs font-medium bg-card border border-border rounded-full hover:border-accent/50 hover:text-accent text-muted-foreground transition-smooth"
                          data-ocid="search.suggestion_chip"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : isLoading ? (
                <div
                  className="flex flex-col gap-3"
                  data-ocid="search.loading_state"
                >
                  <div className="h-5 w-48 bg-muted/40 rounded animate-pulse mb-2" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                    <Skeleton key={i} className="h-28 rounded-md w-full" />
                  ))}
                </div>
              ) : hasResults ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className="text-sm text-muted-foreground"
                      data-ocid="search.results_count"
                    >
                      <span className="font-semibold text-foreground">
                        {results.length}
                      </span>{" "}
                      result{results.length !== 1 ? "s" : ""} for{" "}
                      <span className="font-semibold text-accent">
                        &ldquo;{debouncedQuery.trim()}&rdquo;
                      </span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                        Sort:
                      </span>
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSortBy(opt)}
                          className={`px-2.5 py-1 text-xs rounded-sm border transition-smooth ${sortBy === opt ? "bg-primary/10 text-primary border-primary/30 font-semibold" : "bg-transparent text-muted-foreground border-border hover:text-foreground"}`}
                          data-ocid={`search.sort_${opt.toLowerCase()}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="flex flex-col gap-3"
                    data-ocid="search.results_list"
                  >
                    {results.map((article, i) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        index={i}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center gap-5 py-14 text-center"
                  data-ocid="search.empty_state"
                >
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full bg-muted/50 border border-border/40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-destructive/15 border border-destructive/20 flex items-center justify-center">
                      <X className="h-3.5 w-3.5 text-destructive/60" />
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-display font-semibold text-foreground mb-1">
                      No articles found for &ldquo;{debouncedQuery.trim()}
                      &rdquo;
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Try a different keyword or remove the category filter.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSearch}
                    className="gap-1.5"
                    data-ocid="search.clear_search_button"
                  >
                    <X className="h-3.5 w-3.5" /> Clear search
                  </Button>
                </div>
              )}
            </div>

            {recentSearches.length > 0 && (
              <aside
                className="hidden lg:block w-56 shrink-0"
                data-ocid="search.history_section"
              >
                <div className="bg-card border border-border/60 rounded-lg p-4 sticky top-6">
                  <h2 className="text-xs font-display font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Clock className="h-3.5 w-3.5 text-accent" /> Recent
                    Searches
                  </h2>
                  <div className="flex flex-col gap-1.5">
                    {recentSearches.map((term, i) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleHistoryClick(term)}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-smooth flex items-center gap-2 group"
                        data-ocid={`search.history_item.${i + 1}`}
                      >
                        <Search className="h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-accent transition-colors" />
                        <span className="truncate">{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
