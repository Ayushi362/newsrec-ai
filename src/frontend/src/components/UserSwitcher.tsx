import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/UserContext";
import { ChevronDown, User } from "lucide-react";

export function UserSwitcher() {
  const { userId, setUserId, userIds } = useUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/60 bg-card/80 hover:bg-muted/60 transition-smooth font-mono text-xs"
          data-ocid="user_switcher.toggle"
        >
          <User className="h-3.5 w-3.5 text-accent" />
          <span className="text-foreground">{userId}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40 bg-card border-border/60"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-mono">
          Switch User
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        {userIds.map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setUserId(id)}
            className="font-mono text-xs cursor-pointer"
            data-ocid={`user_switcher.${id}`}
          >
            <span
              className={
                id === userId ? "text-accent font-semibold" : "text-foreground"
              }
            >
              {id}
            </span>
            {id === userId && (
              <span className="ml-auto text-accent text-[10px]">active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
