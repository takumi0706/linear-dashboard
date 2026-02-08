"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamContext } from "@/contexts/team-context";
import { useTeamCycles, useCycleIssues } from "@/hooks/use-linear-data";
import {
  calculateBurndownData,
  calculateScopeCreep,
  calculateVelocityData,
} from "@/lib/utils/metrics";
import { CycleIssuesTable } from "@/components/tables/cycle-issues-table";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { cn } from "@/lib/utils";

const burndownConfig: ChartConfig = {
  remaining: { label: "残ポイント", color: "var(--chart-1)" },
  ideal: { label: "理想ライン", color: "var(--muted-foreground)" },
};

const burnupConfig: ChartConfig = {
  completed: { label: "完了", color: "var(--chart-2)" },
  inProgress: { label: "進行中", color: "var(--chart-3)" },
  scope: { label: "スコープ", color: "var(--chart-1)" },
};

const comparisonConfig: ChartConfig = {
  completedPoints: { label: "完了ポイント", color: "var(--chart-2)" },
  totalPoints: { label: "合計ポイント", color: "var(--chart-1)" },
};

function CycleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CyclesPage() {
  const { teamId } = useTeamContext();
  const { data: cycles, isLoading } = useTeamCycles(teamId);

  const now = useMemo(() => new Date(), []);

  const currentCycle = useMemo(() => {
    if (!cycles) return null;
    return (
      cycles.find(
        (c) => new Date(c.startsAt) <= now && new Date(c.endsAt) >= now
      ) ?? null
    );
  }, [cycles, now]);

  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);

  const selectedCycle = useMemo(() => {
    if (!cycles) return null;
    if (selectedCycleId) {
      return cycles.find((c) => c.id === selectedCycleId) ?? null;
    }
    return currentCycle;
  }, [cycles, selectedCycleId, currentCycle]);

  const { data: cycleIssues } = useCycleIssues(selectedCycle?.id ?? null);

  const burndownData = useMemo(() => {
    if (!selectedCycle) return [];
    return calculateBurndownData(selectedCycle);
  }, [selectedCycle]);

  const scopeCreep = useMemo(() => {
    if (!selectedCycle) return 0;
    return calculateScopeCreep(selectedCycle);
  }, [selectedCycle]);

  const velocityComparison = useMemo(() => {
    if (!cycles) return [];
    return calculateVelocityData(cycles).slice(-5);
  }, [cycles]);

  const cycleStats = useMemo(() => {
    if (!selectedCycle) return null;
    const { scopeHistory, completedScopeHistory, inProgressScopeHistory } =
      selectedCycle;
    const len = scopeHistory.length;
    if (len === 0) return null;

    const totalScope = scopeHistory[len - 1];
    const completedScope = completedScopeHistory[len - 1] ?? 0;
    const inProgressScope = inProgressScopeHistory[len - 1] ?? 0;
    const remainingScope = totalScope - completedScope - inProgressScope;

    const startsAt = new Date(selectedCycle.startsAt);
    const endsAt = new Date(selectedCycle.endsAt);
    const totalDays = Math.ceil(
      (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = Math.ceil(
      (now.getTime() - startsAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const remainingDays = Math.max(totalDays - elapsedDays, 0);
    const isActive = now >= startsAt && now <= endsAt;

    return {
      totalScope,
      completedScope,
      inProgressScope,
      remainingScope: Math.max(remainingScope, 0),
      totalDays,
      remainingDays,
      isActive,
      progress: selectedCycle.progress,
    };
  }, [selectedCycle, now]);

  if (isLoading) return <CycleSkeleton />;

  if (!cycles || cycles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">
          サイクルが見つかりません
        </p>
      </div>
    );
  }

  const sortedCycles = [...cycles].sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-6">
      {/* Cycle Selector */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedCycle?.id ?? undefined}
          onValueChange={setSelectedCycleId}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="サイクルを選択" />
          </SelectTrigger>
          <SelectContent>
            {sortedCycles.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name ?? `Cycle ${c.number}`}
                {c.id === currentCycle?.id && " (現在)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cycleStats?.isActive && (
          <Badge variant="secondary" className="text-xs">
            残り {cycleStats.remainingDays} 日
          </Badge>
        )}
      </div>

      {/* Cycle Overview Cards */}
      {selectedCycle && cycleStats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="py-4">
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                進捗
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(cycleStats.progress * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={cycleStats.progress * 100}
                className="h-1.5"
              />
              <p className="text-xs text-muted-foreground">
                {formatDateRange(selectedCycle.startsAt, selectedCycle.endsAt)}
              </p>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ポイント内訳
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {cycleStats.completedScope}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {cycleStats.totalScope}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-chart-2" />
                  完了 {cycleStats.completedScope}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-chart-3" />
                  進行中 {cycleStats.inProgressScope}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  残 {cycleStats.remainingScope}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="py-4">
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <TermTooltip term="スコープクリープ" />
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    "text-2xl font-bold",
                    scopeCreep <= 10
                      ? "text-emerald-500"
                      : scopeCreep <= 20
                        ? "text-amber-500"
                        : "text-rose-500"
                  )}
                >
                  {scopeCreep > 0 ? "+" : ""}
                  {scopeCreep.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {scopeCreep <= 10
                  ? "スコープは安定しています"
                  : scopeCreep <= 20
                    ? "スコープの増加に注意"
                    : "スコープクリープが発生しています"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Burndown / Burnup Charts */}
      {burndownData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <Tabs defaultValue="burndown">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  サイクル進捗
                </CardTitle>
                <TabsList className="h-8">
                  <TabsTrigger value="burndown" className="text-xs px-3">
                    <TermTooltip term="バーンダウン" showIcon={false} />
                  </TabsTrigger>
                  <TabsTrigger value="burnup" className="text-xs px-3">
                    <TermTooltip term="バーンアップ" showIcon={false} />
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="burndown" className="mt-4">
                <ChartContainer
                  config={burndownConfig}
                  className="h-72 w-full"
                >
                  <AreaChart data={burndownData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/40"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="remaining"
                      fill="var(--color-remaining)"
                      fillOpacity={0.15}
                      stroke="var(--color-remaining)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="ideal"
                      stroke="var(--color-ideal)"
                      strokeWidth={1.5}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </AreaChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="burnup" className="mt-4">
                <ChartContainer config={burnupConfig} className="h-72 w-full">
                  <ComposedChart data={burndownData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border/40"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="1"
                      fill="var(--color-completed)"
                      fillOpacity={0.3}
                      stroke="var(--color-completed)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="inProgress"
                      stackId="1"
                      fill="var(--color-inProgress)"
                      fillOpacity={0.2}
                      stroke="var(--color-inProgress)"
                      strokeWidth={1.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="scope"
                      stroke="var(--color-scope)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      )}

      {/* Cycle Issues Table */}
      {cycleIssues && cycleIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              イシュー一覧
            </CardTitle>
            <CardDescription className="text-xs">
              {cycleIssues.length} 件のイシュー
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CycleIssuesTable issues={cycleIssues} />
          </CardContent>
        </Card>
      )}

      {/* Cycle Comparison */}
      {velocityComparison.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              サイクル比較（直近5サイクル）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={comparisonConfig}
              className="h-56 w-full"
            >
              <BarChart data={velocityComparison}>
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
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(s)} - ${fmt(e)}`;
}
