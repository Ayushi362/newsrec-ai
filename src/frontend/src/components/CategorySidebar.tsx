import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/types";
import { Globe } from "lucide-react";

const ALL_CATEGORIES = ["All", ...CATEGORIES] as const;

interface CategorySidebarProps {
  active?: string;
  onChange?: (category: string) => void;
}

const CAT_ICONS: Record<string, string> = {
  Technology: "💻",
  Business: "📈",
  Health: "🏥",
  Science: "🔬",
  World: "🌍",
  Sports: "⚽",
  Entertainment: "🎬",
};

export function CategorySidebar({
  active = "All",
  onChange,
}: CategorySidebarProps) {
  return (
    <div className="flex flex-col gap-0.5" data-ocid="category_sidebar.list">
      {ALL_CATEGORIES.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange?.(cat)}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-1.5 rounded-sm text-sm text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "bg-accent/15 text-accent font-semibold border border-accent/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            )}
            data-ocid={`category_sidebar.${cat.toLowerCase()}_tab`}
          >
            <span className="text-base leading-none shrink-0">
              {cat === "All" ? (
                <Globe className="h-4 w-4" />
              ) : (
                (CAT_ICONS[cat] ?? "📰")
              )}
            </span>
            <span className="truncate">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
