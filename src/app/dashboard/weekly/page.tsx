"use client";

import { useMemo, useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { useTeamContext } from "@/contexts/team-context";
import { useTeamIssues, useTeamMembers } from "@/hooks/use-linear-data";
import { cn } from "@/lib/utils";
import type { LinearIssue, LinearUser } from "@/lib/linear/types";

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-rose-500",
  2: "text-orange-500",
  3: "text-sky-500",
  4: "text-muted-foreground",
};

const PRIORITY_LABELS: Record<number, string> = {
  0: "None",
  1: "Urgent",
  2: "High",
  3: "Normal",
  4: "Low",
};

interface CompletedIssue {
  issue: LinearIssue;
  completedDate: Date;
  cycleTimeDays: number | null;
}

interface DayGroup {
  dateStr: string;
  label: string;
  issues: CompletedIssue[];
}

interface AssigneeSummary {
  user: LinearUser | null;
  count: number;
  totalEstimate: number;
}

function WeeklySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">
        直近7日間に完了したイシューはありません
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        イシューが完了すると、ここに表示されます
      </p>
    </div>
  );
}

export default function WeeklyPage() {
  const { teamId } = useTeamContext();
  const { data: issues, isLoading: issuesLoading } = useTeamIssues(teamId);
  const { data: members } = useTeamMembers(teamId);
  const [copied, setCopied] = useState(false);

  const now = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  // 直近7日間に完了したイシューを抽出
  const completedIssues = useMemo((): CompletedIssue[] => {
    if (!issues) return [];
    return issues
      .filter((issue) => {
        if (!issue.completedAt) return false;
        const completed = new Date(issue.completedAt);
        return completed >= weekAgo && completed <= now;
      })
      .map((issue) => {
        const completedDate = new Date(issue.completedAt!);
        let cycleTimeDays: number | null = null;
        if (issue.startedAt) {
          const started = new Date(issue.startedAt);
          cycleTimeDays = Math.max(
            (completedDate.getTime() - started.getTime()) /
              (1000 * 60 * 60 * 24),
            0
          );
        }
        return { issue, completedDate, cycleTimeDays };
      })
      .sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  }, [issues, weekAgo, now]);

  // 日付別にグループ化
  const dayGroups = useMemo((): DayGroup[] => {
    const groups = new Map<string, CompletedIssue[]>();

    for (const item of completedIssues) {
      const dateStr = formatDateKey(item.completedDate);
      const existing = groups.get(dateStr);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(dateStr, [item]);
      }
    }

    return Array.from(groups.entries()).map(([dateStr, groupIssues]) => ({
      dateStr,
      label: formatDayLabel(new Date(dateStr), now),
      issues: groupIssues,
    }));
  }, [completedIssues, now]);

  // 担当者別サマリー
  const assigneeSummaries = useMemo((): AssigneeSummary[] => {
    const map = new Map<string, AssigneeSummary>();

    for (const { issue } of completedIssues) {
      const key = issue.assignee?.id ?? "__unassigned__";
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalEstimate += issue.estimate ?? 0;
      } else {
        map.set(key, {
          user: issue.assignee,
          count: 1,
          totalEstimate: issue.estimate ?? 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [completedIssues]);

  // 集計
  const totalCount = completedIssues.length;
  const totalPoints = completedIssues.reduce(
    (sum, { issue }) => sum + (issue.estimate ?? 0),
    0
  );
  const avgCycleTime = useMemo(() => {
    const withCycleTime = completedIssues.filter(
      (c) => c.cycleTimeDays !== null
    );
    if (withCycleTime.length === 0) return null;
    return (
      withCycleTime.reduce((sum, c) => sum + (c.cycleTimeDays ?? 0), 0) /
      withCycleTime.length
    );
  }, [completedIssues]);

  // クリップボードにコピー（Markdown形式で進捗MTG向け）
  const handleCopy = useCallback(() => {
    if (!issues) return;

    const isNotEpicOrPhase = (i: LinearIssue) =>
      !/phase|epic/i.test(i.title);

    // イシューを3カテゴリに分類（Phase/Epicは除外）
    const todoIssues = issues.filter(
      (i) =>
        i.state.type === "unstarted" &&
        i.assignee !== null &&
        isNotEpicOrPhase(i)
    );
    const inProgressIssues = issues.filter(
      (i) => i.state.type === "started" && isNotEpicOrPhase(i)
    );
    const doneIssues = issues.filter((i) => {
      if (i.state.type !== "completed" || !i.completedAt) return false;
      const completed = new Date(i.completedAt);
      return completed >= weekAgo && completed <= now && isNotEpicOrPhase(i);
    });

    // PRリンクを抽出するヘルパー
    const getPrUrls = (issue: LinearIssue): string[] =>
      issue.attachments
        .filter(
          (a) => a.url.includes("github.com") || a.url.includes("gitlab.com")
        )
        .map((a) => a.url);

    // 各イシューのMarkdown行を生成
    const formatIssueLines = (
      issue: LinearIssue,
      category: "todo" | "inProgress" | "done"
    ): string[] => {
      const result: string[] = [];
      result.push(`  - ${issue.title}`);
      result.push(`    - [Linear](${issue.url})`);
      const prUrls = getPrUrls(issue);
      for (const prUrl of prUrls) {
        result.push(`    - [PR](${prUrl})`);
      }
      if (category === "todo" && issue.assignee) {
        result.push(`    - ${issue.assignee.name}さん持ち`);
      } else if (category === "inProgress" && issue.assignee) {
        result.push(
          `    - ${issue.assignee.name}さん -> ${issue.state.name}`
        );
      }
      return result;
    };

    const lines: string[] = [];

    if (todoIssues.length > 0) {
      lines.push("- **ToDo:**");
      for (const issue of todoIssues) {
        lines.push(...formatIssueLines(issue, "todo"));
      }
    }

    if (inProgressIssues.length > 0) {
      lines.push("- **InProgress:**");
      for (const issue of inProgressIssues) {
        lines.push(...formatIssueLines(issue, "inProgress"));
      }
    }

    if (doneIssues.length > 0) {
      lines.push("- **Done:**");
      for (const issue of doneIssues) {
        lines.push(...formatIssueLines(issue, "done"));
      }
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [issues, weekAgo, now]);

  if (issuesLoading) return <WeeklySkeleton />;

  if (!teamId || !issues) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          ヘッダーからチームを選択してください
        </p>
      </div>
    );
  }

  if (completedIssues.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold">週次レビュー</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3" />
            {formatShortDate(weekAgo)} 〜 {formatShortDate(now)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              コピー済み
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Markdownでコピー
            </>
          )}
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="py-4 border-l-2 border-l-chart-2">
          <CardContent className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              完了イシュー
            </p>
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">
              {dayGroups.length} 日間で完了
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 border-l-2 border-l-chart-1">
          <CardContent className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              完了ポイント
            </p>
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">
              平均 {totalCount > 0 ? (totalPoints / totalCount).toFixed(1) : 0}{" "}
              pt/件
            </p>
          </CardContent>
        </Card>
        <Card className="py-4 border-l-2 border-l-chart-3">
          <CardContent className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              平均サイクルタイム
            </p>
            <p className="text-2xl font-bold">
              {avgCycleTime !== null ? `${avgCycleTime.toFixed(1)}日` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">着手から完了まで</p>
          </CardContent>
        </Card>
      </div>

      {/* 担当者別サマリー */}
      {assigneeSummaries.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">担当者別</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {assigneeSummaries.map((s) => {
                const name = s.user?.name ?? "未割当";
                const initials = s.user
                  ? s.user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?";

                return (
                  <div
                    key={s.user?.id ?? "unassigned"}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.user?.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground ml-1.5">
                        {s.count}件
                      </span>
                      {s.totalEstimate > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({s.totalEstimate}pt)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日別イシューリスト */}
      {dayGroups.map((group) => (
        <Card key={group.dateStr}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {group.label}
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {group.issues.length} 件
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 text-xs">ID</TableHead>
                    <TableHead className="text-xs">タイトル</TableHead>
                    <TableHead className="w-28 text-xs">担当者</TableHead>
                    <TableHead className="w-20 text-xs text-center">
                      優先度
                    </TableHead>
                    <TableHead className="w-16 text-xs text-right">
                      PT
                    </TableHead>
                    <TableHead className="w-24 text-xs text-right">
                      サイクルタイム
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.issues.map(({ issue, cycleTimeDays }) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground hover:underline inline-flex items-center gap-1"
                        >
                          {issue.identifier}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {issue.title}
                      </TableCell>
                      <TableCell>
                        {issue.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarImage
                                src={issue.assignee.avatarUrl ?? undefined}
                              />
                              <AvatarFallback className="text-[7px]">
                                {issue.assignee.name.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate">
                              {issue.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            PRIORITY_COLORS[issue.priority] ??
                              "text-muted-foreground"
                          )}
                        >
                          {PRIORITY_LABELS[issue.priority] ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {issue.estimate ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {cycleTimeDays !== null
                          ? `${cycleTimeDays.toFixed(1)}日`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- ユーティリティ ---

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDayLabel(d: Date, now: Date): string {
  const formatted = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = WEEKDAYS[d.getDay()];

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return `今日（${weekday}）`;
  if (diffDays === 1) return `昨日（${weekday}）`;
  return `${formatted}（${weekday}）`;
}
