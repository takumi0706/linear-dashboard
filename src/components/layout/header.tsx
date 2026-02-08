"use client";

import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sun,
  Moon,
  RefreshCw,
  LogOut,
  Menu,
  LayoutDashboard,
  Users,
  GitBranch,
  FolderKanban,
  ClipboardCheck,
  Settings,
} from "lucide-react";
import { RefreshCw as RefreshCwNav } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useViewer, useTeams } from "@/hooks/use-linear-data";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  LayoutDashboard,
  RefreshCw: RefreshCwNav,
  Users,
  GitBranch,
  FolderKanban,
  ClipboardCheck,
  Settings,
} as const;

type IconName = keyof typeof ICON_MAP;

interface HeaderProps {
  selectedTeamId: string | null;
  onTeamChange: (teamId: string) => void;
}

export function Header({ selectedTeamId, onTeamChange }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { data: viewer } = useViewer();
  const { data: teams } = useTeams();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  const handleLogout = useCallback(() => {
    window.location.href = "/api/auth/logout";
  }, []);

  const initials = viewer?.name
    ? viewer.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const formatLastRefresh = (date: Date | null): string => {
    if (!date) return "";
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}秒前`;
    return `${Math.floor(diff / 60)}分前`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">ナビゲーション</SheetTitle>
              <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 100 100"
                    fill="none"
                    className="text-background"
                  >
                    <path
                      d="M1.22541 61.5228C0.444112 60.5535 0.444112 59.1451 1.22541 58.1758L14.3374 42.4311C15.1187 41.4618 16.5271 41.2716 17.4964 42.0529L55.0875 72.6313C56.0568 73.4126 56.247 74.821 55.4657 75.7903L42.3537 91.535C41.5724 92.5043 40.164 92.6945 39.1947 91.9132L1.22541 61.5228Z"
                      fill="currentColor"
                    />
                    <path
                      d="M14.6607 19.5749C13.5949 18.7553 13.4046 17.2129 14.2242 16.1471L27.5765 0.162432C28.3962 -0.903381 29.9385 -1.09369 31.0043 -0.274057L98.7747 52.4271C99.8405 53.2468 100.031 54.7891 99.2113 55.8549L85.859 71.8396C85.0393 72.9054 83.497 73.0957 82.4312 72.2761L14.6607 19.5749Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold tracking-tight">
                  Dashboard
                </span>
              </div>
              <nav className="flex flex-col gap-0.5 px-3 py-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = ICON_MAP[item.icon as IconName];
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Team selector */}
          {teams && teams.length > 0 && (
            <Select
              value={selectedTeamId ?? undefined}
              onValueChange={onTeamChange}
            >
              <SelectTrigger className="h-8 w-40 text-xs border-border/50">
                <SelectValue placeholder="チームを選択" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} className="text-xs">
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Last refresh indicator */}
          {lastRefresh && (
            <span className="hidden sm:inline text-xs text-muted-foreground/60 mr-1">
              {formatLastRefresh(lastRefresh)}
            </span>
          )}

          {/* Refresh button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5",
                    isRefreshing && "animate-spin"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>データを更新</p>
            </TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>テーマ切替</p>
            </TooltipContent>
          </Tooltip>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={viewer?.avatarUrl ?? undefined}
                    alt={viewer?.name ?? "User"}
                  />
                  <AvatarFallback className="text-[10px] font-medium bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{viewer?.name ?? ""}</p>
                <p className="text-xs text-muted-foreground">
                  {viewer?.email ?? ""}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-3.5 w-3.5" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
