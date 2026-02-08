"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  RefreshCw,
  Users,
  GitBranch,
  FolderKanban,
  ClipboardCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const ICON_MAP = {
  LayoutDashboard,
  RefreshCw,
  Users,
  GitBranch,
  FolderKanban,
  ClipboardCheck,
  Settings,
} as const;

type IconName = keyof typeof ICON_MAP;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-border bg-sidebar">
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
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Dashboard
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3 scrollbar-thin overflow-y-auto">
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
              className={cn(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
