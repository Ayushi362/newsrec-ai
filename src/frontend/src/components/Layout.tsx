import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  Home,
  LogIn,
  LogOut,
  Menu,
  Newspaper,
  Search,
  Upload,
  User,
  X,
  Zap,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { CategorySidebar } from "./CategorySidebar";
import { SearchBar } from "./SearchBar";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: Home, authRequired: false },
  { to: "/search", label: "Search", icon: Search, authRequired: false },
  { to: "/metrics", label: "Metrics", icon: BarChart3, authRequired: false },
  { to: "/upload", label: "Upload", icon: Upload, authRequired: true },
  { to: "/profile", label: "Profile", icon: User, authRequired: true },
] as const;

interface LayoutProps {
  children: ReactNode;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  showSidebar?: boolean;
}

export function Layout({
  children,
  activeCategory,
  onCategoryChange,
  showSidebar = true,
}: LayoutProps) {
  const { pathname } = useLocation();
  const { isAuthenticated, identity, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleLinks = NAV_LINKS.filter(
    (l) => !l.authRequired || isAuthenticated,
  );

  const shortId = identity
    ? `${identity.slice(0, 5)}…${identity.slice(-3)}`
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card border-b border-border/60 shadow-xs">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-smooth"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
            data-ocid="layout.sidebar_toggle"
          >
            {sidebarOpen ? (
              <X className="h-4.5 w-4.5" />
            ) : (
              <Menu className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            data-ocid="layout.home_link"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-sm bg-accent/15 border border-accent/30">
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <span className="hidden sm:block font-display font-bold text-sm tracking-tight text-foreground">
              NewsRec <span className="text-accent">AI</span>
            </span>
          </Link>

          {/* Search bar — center */}
          <div className="flex-1 max-w-xl mx-auto">
            <SearchBar />
          </div>

          {/* Auth controls */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-muted/40 border border-border/40 rounded-sm">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {shortId}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  data-ocid="layout.logout_button"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:block">Sign Out</span>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={login}
                className="gap-1.5 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
                data-ocid="layout.login_button"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex max-w-screen-2xl mx-auto w-full">
        {/* Left sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border/60 pt-14 flex flex-col transition-transform duration-300 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 lg:flex lg:flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Sidebar"
        >
          {/* Nav links */}
          <nav
            className="flex flex-col gap-0.5 p-3 pt-4"
            aria-label="Main navigation"
          >
            {visibleLinks.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-smooth",
                    active
                      ? "bg-accent/15 text-accent border border-accent/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  data-ocid={`nav.${label.toLowerCase().replace(/\s+/g, "_")}_link`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/30 mx-3 my-1" />

          {/* Category filter */}
          {showSidebar && (
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2 px-1">
                Categories
              </p>
              <CategorySidebar
                active={activeCategory}
                onChange={(cat) => {
                  onCategoryChange?.(cat);
                  setSidebarOpen(false);
                }}
              />
            </div>
          )}

          {/* Metrics shortcut */}
          <div className="p-3 pt-0">
            <Link
              to="/metrics"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-smooth"
              data-ocid="nav.metrics_sidebar_link"
            >
              <Newspaper className="h-3.5 w-3.5" />
              View Metrics
            </Link>
          </div>
        </aside>

        {/* Overlay on mobile */}
        {sidebarOpen && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: overlay trap, close button handles keyboard
          <div
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-background">{children}</main>
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border/40 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground font-mono">
            © {new Date().getFullYear()} NewsRec AI — AI-Powered Recommendation
            System
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
