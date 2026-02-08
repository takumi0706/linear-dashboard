"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useTeamContext } from "@/contexts/team-context";
import {
  useTeamIssues,
  useTeamStates,
  useTeamMembers,
} from "@/hooks/use-linear-data";
import {
  calculateCfdData,
  calculateStatusDwellTime,
  calculateCycleTimeScatter,
  calculateLeadTimeHistogram,
} from "@/lib/utils/metrics";
import { TermTooltip } from "@/components/shared/term-tooltip";
import { cn } from "@/lib/utils";

const dwellConfig: ChartConfig = {
  averageDays: { label: "平均滞留日数", color: "var(--chart-1)" },
};

const leadTimeConfig: ChartConfig = {
  count: { label: "イシュー数", color: "var(--chart-2)" },
};

const scatterConfig: ChartConfig = {
  cycleTimeDays: { label: "サイクルタイム (日)", color: "var(--chart-1)" },
};

function WorkflowSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="py-4">
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkflowPage() {
  const { teamId } = useTeamContext();
  const { data: issues, isLoading: issuesLoading } = useTeamIssues(teamId);
  const { data: states, isLoading: statesLoading } = useTeamStates(teamId);
  const { data: members } = useTeamMembers(teamId);

  const isLoading = issuesLoading || statesLoading;

  // WIP monitor
  const wipData = useMemo(() => {
    if (!issues || !members) return null;
    const wipCount = issues.filter(
      (i) => i.state.type === "started" && !i.archivedAt
    ).length;
    const recommendedLimit = members.length * 2;
    return { wipCount, recommendedLimit };
  }, [issues, members]);

  // CFD
  const cfdData = useMemo(() => {
    if (!issues || !states) return [];
    return calculateCfdData(issues, states, 30);
  }, [issues, states]);

  const cfdConfig: ChartConfig = useMemo(() => {
    if (!states) return {};
    return Object.fromEntries(
      states.map((s) => [s.name, { label: s.name, color: s.color }])
    );
  }, [states]);

  // Dwell time
  const dwellData = useMemo(() => {
    if (!issues || !states) return [];
    return calculateStatusDwellTime(issues, states).filter(
      (d) => d.averageDays > 0 || d.issueCount > 0
    );
  }, [issues, states]);

  // Cycle time scatter
  const scatterData = useMemo(() => {
    if (!issues) return [];
    return calculateCycleTimeScatter(issues);
  }, [issues]);

  const scatterAvg = useMemo(() => {
    if (scatterData.length === 0) return 0;
    return (
      scatterData.reduce((s, d) => s + d.cycleTimeDays, 0) /
      scatterData.length
    );
  }, [scatterData]);

  // Lead time histogram
  const leadTimeData = useMemo(() => {
    if (!issues) return { bins: [], median: 0, p85: 0, p95: 0 };
    return calculateLeadTimeHistogram(issues);
  }, [issues]);

  if (isLoading) return <WorkflowSkeleton />;

  if (!issues || !states) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">データがありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* WIP Monitor */}
      {wipData && (
        <Card className="py-4">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <TermTooltip term="WIP" showIcon={false} /> モニター
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={cn(
                      "text-3xl font-bold",
                      wipData.wipCount > wipData.recommendedLimit
                        ? "text-rose-500"
                        : "text-foreground"
                    )}
                  >
                    {wipData.wipCount}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {wipData.recommendedLimit} 推奨上限
                  </span>
                </div>
              </div>
              {wipData.wipCount > wipData.recommendedLimit && (
                <Badge
                  variant="outline"
                  className="bg-rose-500/10 text-rose-500 border-rose-500/20"
                >
                  上限超過
                </Badge>
              )}
            </div>
            <Progress
              value={Math.min(
                (wipData.wipCount / wipData.recommendedLimit) * 100,
                100
              )}
              className={cn(
                "h-2",
                wipData.wipCount > wipData.recommendedLimit &&
                  "[&>div]:bg-rose-500"
              )}
            />
            <p className="text-xs text-muted-foreground">
              推奨 <TermTooltip term="WIPリミット" showIcon={false} /> = メンバー数({members?.length ?? 0}) × 2
            </p>
          </CardContent>
        </Card>
      )}

      {/* CFD */}
      {cfdData.length > 0 && states && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <TermTooltip term="累積フローダイアグラム（CFD）" />
            </CardTitle>
            <CardDescription className="text-xs">
              過去30日間のステータス別イシュー推移
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cfdConfig} className="h-72 w-full">
              <AreaChart data={cfdData}>
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
                {[...states]
                  .sort((a, b) => a.position - b.position)
                  .map((state) => (
                    <Area
                      key={state.id}
                      type="monotone"
                      dataKey={state.name}
                      stackId="1"
                      fill={state.color}
                      fillOpacity={0.4}
                      stroke={state.color}
                      strokeWidth={1}
                    />
                  ))}
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dwell Time */}
        {dwellData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                ステータス別平均<TermTooltip term="滞留時間" showIcon={false} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={dwellConfig}
                className="w-full"
                style={{
                  height: `${Math.max(dwellData.length * 36 + 40, 140)}px`,
                }}
              >
                <BarChart
                  data={dwellData}
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
                    unit="日"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="averageDays" radius={[0, 4, 4, 0]}>
                    {dwellData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.isAnomaly ? "var(--destructive)" : entry.color}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Cycle Time Scatter */}
        {scatterData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <TermTooltip term="サイクルタイム">サイクルタイム散布図</TermTooltip>
              </CardTitle>
              <CardDescription className="text-xs">
                平均 {scatterAvg.toFixed(1)} 日
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={scatterConfig} className="h-56 w-full">
                <ScatterChart margin={{ left: 0, right: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/40"
                  />
                  <XAxis
                    dataKey="completedAt"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    dataKey="cycleTimeDays"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    unit="日"
                  />
                  <ZAxis range={[24, 24]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_label, payload) => {
                          if (!payload?.[0]) return "";
                          const item = payload[0].payload as {
                            identifier: string;
                            title: string;
                          };
                          return `${item.identifier}: ${item.title}`;
                        }}
                      />
                    }
                  />
                  <ReferenceLine
                    y={scatterAvg}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <Scatter
                    data={scatterData}
                    fill="var(--color-cycleTimeDays)"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lead Time Histogram */}
      {leadTimeData.bins.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <TermTooltip term="リードタイム">リードタイム分布</TermTooltip>
            </CardTitle>
            <CardDescription className="text-xs">
              中央値 {leadTimeData.median.toFixed(1)}日 ・ 85th{" "}
              {leadTimeData.p85.toFixed(1)}日 ・ 95th{" "}
              {leadTimeData.p95.toFixed(1)}日
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={leadTimeConfig} className="h-56 w-full">
              <BarChart data={leadTimeData.bins} margin={{ left: 0, right: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "日数",
                    position: "insideBottomRight",
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                    offset: -4,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ReferenceLine
                  x={leadTimeData.bins.find(
                    (b) =>
                      leadTimeData.median >= b.min &&
                      leadTimeData.median < b.max
                  )?.range}
                  stroke="var(--chart-2)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "中央値",
                    position: "top",
                    fontSize: 10,
                    fill: "var(--chart-2)",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
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
