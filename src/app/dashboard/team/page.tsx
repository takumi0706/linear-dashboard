"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTeamContext } from "@/contexts/team-context";
import {
  useTeamIssues,
  useTeamMembers,
} from "@/hooks/use-linear-data";
import { calculateMemberWorkload } from "@/lib/utils/metrics";
import { CHART_COLORS } from "@/lib/constants";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { cn } from "@/lib/utils";
import type { LinearIssue, MemberWorkload } from "@/lib/linear/types";

interface WorkloadBarData {
  name: string;
  avatarUrl: string | null;
  completed: number;
  inProgress: number;
  other: number;
  total: number;
}

interface LabelDistData {
  name: string;
  count: number;
  color: string;
}

const workloadConfig: ChartConfig = {
  completed: { label: "完了", color: "var(--chart-2)" },
  inProgress: { label: "進行中", color: "var(--chart-3)" },
  other: { label: "その他", color: "var(--muted-foreground)" },
};

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
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
      <p className="text-sm text-muted-foreground">
        チームメンバーのデータがありません
      </p>
    </div>
  );
}

export default function TeamPage() {
  const { teamId } = useTeamContext();
  const { data: issues, isLoading: issuesLoading } = useTeamIssues(teamId);
  const { data: members, isLoading: membersLoading } = useTeamMembers(teamId);

  const isLoading = issuesLoading || membersLoading;

  const workloads = useMemo(() => {
    if (!issues || !members) return [];
    return calculateMemberWorkload(issues, members);
  }, [issues, members]);

  const workloadBarData: WorkloadBarData[] = useMemo(() => {
    return workloads
      .map((w) => ({
        name: w.user.name,
        avatarUrl: w.user.avatarUrl,
        completed: w.completedCount,
        inProgress: w.inProgressCount,
        other: w.assignedCount - w.completedCount - w.inProgressCount,
        total: w.assignedCount,
      }))
      .sort((a, b) => b.total - a.total);
  }, [workloads]);

  const averageWorkload = useMemo(() => {
    if (workloadBarData.length === 0) return 0;
    return (
      workloadBarData.reduce((sum, w) => sum + w.total, 0) /
      workloadBarData.length
    );
  }, [workloadBarData]);

  const labelDistribution: LabelDistData[] = useMemo(() => {
    if (!issues) return [];
    const activeIssues = issues.filter(
      (i) => !i.archivedAt && i.state.type !== "canceled"
    );
    const labelCounts = new Map<string, number>();

    for (const issue of activeIssues) {
      if (issue.labels.length === 0) {
        labelCounts.set("ラベルなし", (labelCounts.get("ラベルなし") ?? 0) + 1);
      } else {
        for (const label of issue.labels) {
          labelCounts.set(label.name, (labelCounts.get(label.name) ?? 0) + 1);
        }
      }
    }

    return Array.from(labelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], i) => ({
        name,
        count,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));
  }, [issues]);

  const labelChartConfig: ChartConfig = useMemo(() => {
    return Object.fromEntries(
      labelDistribution.map((l) => [l.name, { label: l.name, color: l.color }])
    );
  }, [labelDistribution]);

  if (isLoading) return <TeamSkeleton />;
  if (!members || members.length === 0) return <EmptyState />;

  return (
    <div className="space-y-6">
      {/* Workload Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">作業負荷分布</CardTitle>
          <CardDescription className="text-xs">
            メンバー別の担当イシュー数（ステータス別）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={workloadConfig}
            className="w-full"
            style={{
              height: `${Math.max(workloadBarData.length * 40 + 40, 160)}px`,
            }}
          >
            <BarChart
              data={workloadBarData}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/40"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine
                x={averageWorkload}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `平均 ${averageWorkload.toFixed(1)}`,
                  position: "top",
                  fontSize: 10,
                  fill: "var(--muted-foreground)",
                }}
              />
              <Bar
                dataKey="completed"
                stackId="a"
                fill="var(--color-completed)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="inProgress"
                stackId="a"
                fill="var(--color-inProgress)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="other"
                stackId="a"
                fill="var(--color-other)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Member Summary Cards */}
      <div>
        <h2 className="text-sm font-medium mb-3">メンバーサマリー</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workloads.map((w) => (
            <MemberCard key={w.user.id} workload={w} />
          ))}
        </div>
      </div>

      {/* Label Distribution */}
      {labelDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              ラベル別作業内訳
            </CardTitle>
            <CardDescription className="text-xs">
              チーム全体のイシューカテゴリ分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <ChartContainer
                config={labelChartConfig}
                className="h-56 w-56 shrink-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={labelDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="var(--background)"
                  >
                    {labelDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {labelDistribution.map((l) => (
                  <div key={l.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {l.name}{" "}
                      <span className="font-medium text-foreground">
                        {l.count}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MemberCard({ workload }: { workload: MemberWorkload }) {
  const { user, assignedCount, completedCount, inProgressCount, averageCycleTime } =
    workload;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="py-4">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-lg font-bold">{assignedCount}</p>
            <p className="text-[10px] text-muted-foreground">担当</p>
          </div>
          <div>
            <p className="text-lg font-bold text-chart-2">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground">完了</p>
          </div>
          <div>
            <p className="text-lg font-bold text-chart-3">{inProgressCount}</p>
            <p className="text-[10px] text-muted-foreground">進行中</p>
          </div>
        </div>

        {averageCycleTime !== null && (
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground">
              平均<TermTooltip term="サイクルタイム" showIcon={false} />
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {averageCycleTime.toFixed(1)} 日
            </Badge>
          </div>
        )}

        {inProgressCount > 5 && (
          <div className="rounded-md bg-rose-500/5 border border-rose-500/20 px-2.5 py-1.5">
            <p className="text-[10px] text-rose-500 font-medium">
              <TermTooltip term="WIP" showIcon={false} /> が {inProgressCount} 件に集中しています
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
