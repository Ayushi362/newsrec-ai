import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

interface SearchBarProps {
  initialValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  initialValue = "",
  onSearch,
  placeholder = "Search news…",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();

  const handleSearch = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (onSearch) {
      onSearch(trimmed);
    } else {
      void navigate({ to: "/search", search: { q: trimmed, category: "" } });
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setValue("");
  };

  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="pl-8 pr-8 h-9 text-sm bg-muted/40 border-border/50 focus:bg-card focus:border-accent/50 transition-smooth placeholder:text-muted-foreground/60 rounded-full"
        data-ocid="layout.search_input"
        aria-label="Search news articles"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
          data-ocid="layout.search_clear_button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
