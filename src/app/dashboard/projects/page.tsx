"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Calendar, Clock, ExternalLink } from "lucide-react";
import { useTeamContext } from "@/contexts/team-context";
import { useTeamProjects, useTeamIssues } from "@/hooks/use-linear-data";
import { detectRiskIssues } from "@/lib/utils/metrics";
import { cn } from "@/lib/utils";
import type { LinearProject, RiskIssue } from "@/lib/linear/types";

const STATE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planned: { label: "計画中", variant: "outline" },
  started: { label: "進行中", variant: "default" },
  paused: { label: "一時停止", variant: "secondary" },
  completed: { label: "完了", variant: "secondary" },
  canceled: { label: "キャンセル", variant: "destructive" },
};

const RISK_ICONS: Record<RiskIssue["reason"], { label: string; className: string }> = {
  overdue: { label: "期限超過", className: "text-rose-500" },
  stale_wip: { label: "長期WIP", className: "text-amber-500" },
  high_priority_unstarted: { label: "高優先度未着手", className: "text-orange-500" },
};

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-muted-foreground">プロジェクトがありません</p>
    </div>
  );
}

export default function ProjectsPage() {
  const { teamId } = useTeamContext();
  const { data: projects, isLoading: projectsLoading } = useTeamProjects(teamId);
  const { data: issues, isLoading: issuesLoading } = useTeamIssues(teamId);

  const isLoading = projectsLoading || issuesLoading;

  const riskIssues = useMemo(() => {
    if (!issues) return [];
    return detectRiskIssues(issues);
  }, [issues]);

  const timelineData = useMemo(() => {
    if (!projects) return [];
    // タイムラインには日付が少なくとも1つあるプロジェクトのみ
    // startedAt, targetDate, completedAt のいずれか
    return projects
      .filter((p) => p.startedAt || p.targetDate || p.completedAt)
      .sort((a, b) => {
        const aStart = a.startedAt
          ? new Date(a.startedAt).getTime()
          : a.targetDate
            ? new Date(a.targetDate).getTime()
            : Infinity;
        const bStart = b.startedAt
          ? new Date(b.startedAt).getTime()
          : b.targetDate
            ? new Date(b.targetDate).getTime()
            : Infinity;
        return aStart - bStart;
      });
  }, [projects]);

  if (isLoading) return <ProjectsSkeleton />;
  if (!projects || projects.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Project Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {/* Project Timeline */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              プロジェクトタイムライン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectTimeline projects={timelineData} />
          </CardContent>
        </Card>
      )}

      {/* Risk Detection */}
      {riskIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <CardTitle className="text-sm font-medium">
                リスク検出
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {riskIssues.length} 件の要注意イシュー
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-80 scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 text-xs">ID</TableHead>
                    <TableHead className="text-xs">タイトル</TableHead>
                    <TableHead className="w-32 text-xs">タイプ</TableHead>
                    <TableHead className="text-xs">詳細</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskIssues.slice(0, 20).map((risk, idx) => {
                    const riskInfo = RISK_ICONS[risk.reason];
                    return (
                      <TableRow key={`${risk.issue.id}-${idx}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          <a
                            href={risk.issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground hover:underline"
                          >
                            {risk.issue.identifier}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {risk.issue.title}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", riskInfo.className)}
                          >
                            {riskInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {risk.detail}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Omit<LinearProject, "issues"> }) {
  const now = new Date();
  const stateInfo = STATE_BADGE[project.state.toLowerCase()] ?? STATE_BADGE.planned;

  const isOverdue =
    project.targetDate &&
    new Date(project.targetDate) < now &&
    project.state.toLowerCase() !== "completed";

  return (
    <Card className="py-4 transition-colors hover:bg-card/80">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">{project.name}</h3>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {project.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <Badge variant={stateInfo.variant} className="text-[10px] shrink-0">
            {stateInfo.label}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">進捗</span>
            <span className="font-medium">
              {(project.progress * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={project.progress * 100} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {project.lead && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={project.lead.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[7px]">
                  {project.lead.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{project.lead.name}</span>
            </div>
          )}
          {project.targetDate && (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue && "text-rose-500"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDate(project.targetDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineBar {
  project: Omit<LinearProject, "issues">;
  startMs: number;
  endMs: number;
  isOverdue: boolean;
}

function ProjectTimeline({
  projects,
}: {
  projects: Omit<LinearProject, "issues">[];
}) {
  const now = new Date();
  const nowMs = now.getTime();
  const ONE_DAY = 1000 * 60 * 60 * 24;

  // 各プロジェクトの開始・終了を確定
  const bars: TimelineBar[] = projects.map((p) => {
    const startMs = p.startedAt
      ? new Date(p.startedAt).getTime()
      : p.targetDate
        ? new Date(p.targetDate).getTime() - 90 * ONE_DAY // targetDateのみの場合は90日前を仮起点
        : nowMs;

    const endMs = p.completedAt
      ? new Date(p.completedAt).getTime()
      : p.targetDate
        ? new Date(p.targetDate).getTime()
        : nowMs + 30 * ONE_DAY; // 終了未定の場合は30日後

    // start > end にならないよう保証
    const safeStart = Math.min(startMs, endMs);
    const safeEnd = Math.max(startMs, endMs);

    const isOverdue =
      !!p.targetDate &&
      new Date(p.targetDate) < now &&
      p.state.toLowerCase() !== "completed";

    return { project: p, startMs: safeStart, endMs: safeEnd, isOverdue };
  });

  if (bars.length === 0) return null;

  // タイムライン全体のレンジを計算（前後に余白を追加）
  const allStarts = bars.map((b) => b.startMs);
  const allEnds = bars.map((b) => b.endMs);
  const dataMin = Math.min(...allStarts, nowMs);
  const dataMax = Math.max(...allEnds, nowMs);
  const dataRange = dataMax - dataMin || ONE_DAY;
  const padding = dataRange * 0.08; // 8% のパディング
  const rangeMin = dataMin - padding;
  const rangeMax = dataMax + padding;
  const totalRange = rangeMax - rangeMin;

  const toPercent = (ms: number) =>
    ((ms - rangeMin) / totalRange) * 100;

  const nowPercent = toPercent(nowMs);

  // 月ごとの目盛り生成
  const monthTicks: Array<{ label: string; percent: number }> = [];
  const tickStart = new Date(rangeMin);
  tickStart.setDate(1);
  tickStart.setHours(0, 0, 0, 0);
  // 次の月初から開始
  tickStart.setMonth(tickStart.getMonth() + 1);
  const tickEnd = new Date(rangeMax);
  const cursor = new Date(tickStart);
  while (cursor <= tickEnd) {
    const ms = cursor.getTime();
    const pct = toPercent(ms);
    if (pct >= 0 && pct <= 100) {
      monthTicks.push({
        label: `${cursor.getMonth() + 1}月`,
        percent: pct,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="space-y-1">
      {/* 月目盛り + 今日マーカー */}
      <div className="relative h-5 ml-32 mr-14">
        {monthTicks.map((tick) => (
          <span
            key={tick.label + tick.percent}
            className="absolute -translate-x-1/2 text-[10px] text-muted-foreground/60 bottom-0"
            style={{ left: `${tick.percent}%` }}
          >
            {tick.label}
          </span>
        ))}
        <span
          className="absolute -translate-x-1/2 text-[9px] font-medium text-rose-500 bottom-0"
          style={{ left: `${clamp(nowPercent)}%` }}
        >
          今日
        </span>
      </div>

      {/* プロジェクトバー */}
      {bars.map(({ project, startMs, endMs, isOverdue }) => {
        const leftPct = clamp(toPercent(startMs));
        const rightPct = clamp(toPercent(endMs));
        const widthPct = Math.max(rightPct - leftPct, 1.5); // 最小幅 1.5%

        const barColorBg = isOverdue
          ? "bg-rose-500/30"
          : project.state.toLowerCase() === "completed"
            ? "bg-emerald-500/30"
            : "bg-sky-500/30";

        const barColorFill = isOverdue
          ? "bg-rose-500"
          : project.state.toLowerCase() === "completed"
            ? "bg-emerald-500"
            : "bg-sky-500";

        const dateLabel = [
          startMs ? shortDate(new Date(startMs)) : null,
          endMs ? shortDate(new Date(endMs)) : null,
        ]
          .filter(Boolean)
          .join(" → ");

        return (
          <div key={project.id} className="flex items-center gap-3 group">
            <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
              {project.name}
            </span>
            <div className="relative flex-1 h-7 rounded bg-muted/30">
              {/* 月のグリッド線 */}
              {monthTicks.map((tick) => (
                <div
                  key={tick.label + tick.percent}
                  className="absolute top-0 h-full w-px bg-border/30"
                  style={{ left: `${tick.percent}%` }}
                />
              ))}
              {/* プロジェクトバー */}
              <div
                className={cn(
                  "absolute top-1 bottom-1 rounded transition-opacity",
                  barColorBg
                )}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                }}
              >
                {/* 進捗フィル */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded",
                    barColorFill
                  )}
                  style={{ width: `${project.progress * 100}%` }}
                />
                {/* ホバー時に日付範囲表示 */}
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                  {dateLabel}
                </span>
              </div>
              {/* 今日マーカー */}
              <div
                className="absolute top-0 h-full w-px bg-rose-500/50"
                style={{ left: `${clamp(nowPercent)}%` }}
              />
            </div>
            <div className="w-12 shrink-0 text-right">
              <span
                className={cn(
                  "text-xs font-medium",
                  isOverdue ? "text-rose-500" : "text-foreground"
                )}
              >
                {(project.progress * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}

      {/* 凡例 */}
      <div className="flex gap-4 ml-32 mt-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-sky-500" />
          進行中
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-emerald-500" />
          完了
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-rose-500" />
          期限超過
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-sm bg-sky-500/30 border border-sky-500/40" />
          残りスコープ
        </div>
      </div>
    </div>
  );
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

function shortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
