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
  const { currentUserId, currentUser, allUsers, switchUser } = useUser();

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
          <span className="text-foreground hidden sm:block">
            {currentUser?.name ?? currentUserId}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 bg-card border-border/60"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-mono">
          Switch Demo User
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        {allUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => switchUser(user.id)}
            className="cursor-pointer flex flex-col items-start gap-0.5"
            data-ocid={`user_switcher.${user.id}`}
          >
            <span
              className={
                user.id === currentUserId
                  ? "text-accent font-semibold text-xs"
                  : "text-foreground text-xs"
              }
            >
              {user.name}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {user.region} · {user.interests.join(", ")}
            </span>
            {user.id === currentUserId && (
              <span className="ml-auto text-accent text-[10px]">active</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
