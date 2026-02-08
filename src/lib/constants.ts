// Status colors matching Linear's workflow state types
export const STATUS_COLORS = {
  triage: "hsl(var(--chart-5))",
  backlog: "hsl(var(--muted-foreground))",
  unstarted: "hsl(var(--chart-1))",
  started: "hsl(var(--chart-3))",
  completed: "hsl(var(--chart-2))",
  canceled: "hsl(var(--destructive))",
} as const;

// Priority configuration
export const PRIORITY_CONFIG = {
  0: { label: "No Priority", color: "hsl(var(--muted-foreground))" },
  1: { label: "Urgent", color: "hsl(0, 84%, 60%)" },
  2: { label: "High", color: "hsl(25, 95%, 53%)" },
  3: { label: "Normal", color: "hsl(221, 83%, 53%)" },
  4: { label: "Low", color: "hsl(var(--muted-foreground))" },
} as const;

// Thresholds for actionable insights
export const THRESHOLDS = {
  carryoverRate: { warning: 20, danger: 30 },
  scopeCreep: { warning: 10, danger: 20 },
  wipPerMember: { warning: 3, danger: 5 },
  cycleTimeMultiplier: { warning: 1.5, danger: 2.0 },
  bugRate: { warning: 20, danger: 30 },
} as const;

// Data refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  auto: 5 * 60 * 1000, // 5 minutes
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
} as const;

// Chart color palette for member identification (colorblind-safe)
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
] as const;

// Navigation items
export const NAV_ITEMS = [
  { href: "/dashboard", label: "概要", icon: "LayoutDashboard" },
  { href: "/dashboard/cycles", label: "サイクル", icon: "RefreshCw" },
  { href: "/dashboard/team", label: "チーム", icon: "Users" },
  { href: "/dashboard/workflow", label: "フロー", icon: "GitBranch" },
  { href: "/dashboard/projects", label: "プロジェクト", icon: "FolderKanban" },
  { href: "/dashboard/weekly", label: "週次レビュー", icon: "ClipboardCheck" },
  { href: "/dashboard/settings", label: "設定", icon: "Settings" },
] as const;
