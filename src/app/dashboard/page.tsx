"use client";

import { useMemo } from "react";
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  BarChart,
  Bar as RechartsBar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { KpiCard } from "@/components/cards/kpi-card";
import { InsightBanner } from "@/components/shared/insight-banner";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { useTeamContext } from "@/contexts/team-context";
import {
  useTeamIssues,
  useTeamCycles,
  useTeamMembers,
} from "@/hooks/use-linear-data";
import {
  calculateKpiMetrics,
  calculateVelocityData,
  calculateStatusDistribution,
  calculatePriorityDistribution,
  calculateScopeCreep,
  generateInsights,
} from "@/lib/utils/metrics";

const velocityConfig: ChartConfig = {
  completedPoints: {
    label: "完了ポイント",
    color: "var(--chart-2)",
  },
  totalPoints: {
    label: "合計ポイント",
    color: "var(--chart-1)",
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="space-y-3">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <svg
          className="h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-foreground">データがありません</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        ヘッダーからチームを選択してください
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { teamId } = useTeamContext();
  const { data: issues, isLoading: issuesLoading } = useTeamIssues(teamId);
  const { data: cycles, isLoading: cyclesLoading } = useTeamCycles(teamId);
  const { data: members } = useTeamMembers(teamId);

  const isLoading = issuesLoading || cyclesLoading;

  const currentCycle = useMemo(() => {
    if (!cycles) return null;
    const now = new Date();
    return (
      cycles.find(
        (c) => new Date(c.startsAt) <= now && new Date(c.endsAt) >= now
      ) ?? null
    );
  }, [cycles]);

  const previousCycle = useMemo(() => {
    if (!cycles || !currentCycle) return null;
    return (
      cycles.find((c) => c.number === currentCycle.number - 1) ?? null
    );
  }, [cycles, currentCycle]);

  const kpi = useMemo(() => {
    if (!issues) return null;
    return calculateKpiMetrics(issues, currentCycle, previousCycle);
  }, [issues, currentCycle, previousCycle]);

  const velocityData = useMemo(() => {
    if (!cycles) return [];
    return calculateVelocityData(cycles).slice(-8);
  }, [cycles]);

  const statusDistribution = useMemo(() => {
    if (!issues) return [];
    return calculateStatusDistribution(issues);
  }, [issues]);

  const priorityDistribution = useMemo(() => {
    if (!issues) return [];
    return calculatePriorityDistribution(issues);
  }, [issues]);

  const scopeCreep = useMemo(() => {
    if (!currentCycle) return 0;
    return calculateScopeCreep(currentCycle);
  }, [currentCycle]);

  const insights = useMemo(() => {
    if (!kpi || !issues || !members) return [];
    return generateInsights(kpi, scopeCreep, issues, members);
  }, [kpi, scopeCreep, issues, members]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!teamId || !issues) {
    return <EmptyState />;
  }

  const statusChartConfig: ChartConfig = Object.fromEntries(
    statusDistribution.map((s) => [
      s.name,
      { label: s.name, color: s.color },
    ])
  );

  const priorityChartConfig: ChartConfig = Object.fromEntries(
    priorityDistribution.map((p) => [
      p.label,
      { label: p.label, color: p.color },
    ])
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={<TermTooltip term="完了率" />}
          value={`${(kpi?.completionRate ?? 0).toFixed(0)}%`}
          subtitle="現在のサイクル"
          previousValue={kpi?.previousCompletionRate}
          currentValue={kpi?.completionRate}
          accentColor="blue"
        />
        <KpiCard
          title={<TermTooltip term="サイクルタイム">平均サイクルタイム</TermTooltip>}
          value={`${(kpi?.averageCycleTime ?? 0).toFixed(1)}日`}
          subtitle="直近30日"
          previousValue={kpi?.previousAverageCycleTime}
          currentValue={kpi?.averageCycleTime}
          invertTrend
          accentColor="green"
        />
        <KpiCard
          title={<TermTooltip term="スループット">週間スループット</TermTooltip>}
          value={`${kpi?.weeklyThroughput ?? 0}`}
          subtitle="完了イシュー数"
          previousValue={kpi?.previousWeeklyThroughput}
          currentValue={kpi?.weeklyThroughput}
          accentColor="amber"
        />
        <KpiCard
          title={<TermTooltip term="キャリーオーバー率" />}
          value={`${(kpi?.carryoverRate ?? 0).toFixed(0)}%`}
          subtitle="前サイクル末"
          previousValue={kpi?.previousCarryoverRate}
          currentValue={kpi?.carryoverRate}
          invertTrend
          accentColor="rose"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Velocity Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <TermTooltip term="ベロシティ">ベロシティトレンド</TermTooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={velocityConfig} className="h-64 w-full">
              <ComposedChart data={velocityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="cycleName"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="totalPoints"
                  fill="var(--color-totalPoints)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.3}
                />
                <Bar
                  dataKey="completedPoints"
                  fill="var(--color-completedPoints)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="completedPoints"
                  stroke="var(--color-completedPoints)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-completedPoints)" }}
                  tooltipType="none"
                />
              </ComposedChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              ステータス分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusChartConfig}
              className="h-64 w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {statusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {statusDistribution.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {s.name}{" "}
                    <span className="font-medium text-foreground">
                      {s.count}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Priority Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              優先度分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={priorityChartConfig}
              className="h-48 w-full"
            >
              <BarChart
                data={priorityDistribution}
                layout="vertical"
                margin={{ left: 8, right: 8 }}
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
                  dataKey="label"
                  type="category"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <RechartsBar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityDistribution.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </RechartsBar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              インサイト
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightBanner insights={insights} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
