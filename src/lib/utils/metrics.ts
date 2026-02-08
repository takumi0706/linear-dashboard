import type {
  LinearIssue,
  LinearCycle,
  KpiMetrics,
  VelocityDataPoint,
  MemberWorkload,
  StatusDistribution,
  PriorityDistribution,
  BurndownDataPoint,
  CycleTimeDataPoint,
  InsightMessage,
  LinearUser,
  LinearWorkflowState,
  CfdDataPoint,
  StatusDwellTime,
  LeadTimeHistogramBin,
  RiskIssue,
} from "@/lib/linear/types";
import { PRIORITY_CONFIG, THRESHOLDS } from "@/lib/constants";

// --- Helper ---

function businessDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current < end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return Math.max(count, 0);
}

function daysBetween(start: string, end: string): number {
  return businessDaysBetween(new Date(start), new Date(end));
}

// --- Cycle Time ---

export function calculateCycleTime(issue: LinearIssue): number | null {
  if (!issue.completedAt) return null;
  const start = issue.startedAt ?? issue.createdAt;
  return daysBetween(start, issue.completedAt);
}

// --- Lead Time ---

export function calculateLeadTime(issue: LinearIssue): number | null {
  if (!issue.completedAt) return null;
  return daysBetween(issue.createdAt, issue.completedAt);
}

// --- KPI Metrics ---

export function calculateKpiMetrics(
  issues: LinearIssue[],
  currentCycle: Omit<LinearCycle, "issues"> | null,
  previousCycle: Omit<LinearCycle, "issues"> | null
): KpiMetrics {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Completion rate from current cycle
  const completionRate = currentCycle ? currentCycle.progress * 100 : 0;
  const previousCompletionRate = previousCycle
    ? previousCycle.progress * 100
    : null;

  // Average cycle time (completed issues in last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentCompleted = issues.filter(
    (i) =>
      i.completedAt && new Date(i.completedAt) > thirtyDaysAgo
  );
  const cycleTimes = recentCompleted
    .map(calculateCycleTime)
    .filter((ct): ct is number => ct !== null);
  const averageCycleTime =
    cycleTimes.length > 0
      ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
      : 0;

  // Previous average cycle time (30-60 days ago)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prevCompleted = issues.filter(
    (i) =>
      i.completedAt &&
      new Date(i.completedAt) > sixtyDaysAgo &&
      new Date(i.completedAt) <= thirtyDaysAgo
  );
  const prevCycleTimes = prevCompleted
    .map(calculateCycleTime)
    .filter((ct): ct is number => ct !== null);
  const previousAverageCycleTime =
    prevCycleTimes.length > 0
      ? prevCycleTimes.reduce((a, b) => a + b, 0) / prevCycleTimes.length
      : null;

  // Weekly throughput
  const weeklyThroughput = issues.filter(
    (i) => i.completedAt && new Date(i.completedAt) > oneWeekAgo
  ).length;
  const previousWeeklyThroughput = issues.filter(
    (i) =>
      i.completedAt &&
      new Date(i.completedAt) > twoWeeksAgo &&
      new Date(i.completedAt) <= oneWeekAgo
  ).length;

  // Carryover rate
  let carryoverRate = 0;
  let previousCarryoverRate: number | null = null;
  if (previousCycle) {
    const scopeHistory = previousCycle.scopeHistory;
    const completedHistory = previousCycle.completedScopeHistory;
    if (scopeHistory.length > 0 && completedHistory.length > 0) {
      const totalScope = scopeHistory[scopeHistory.length - 1];
      const completed = completedHistory[completedHistory.length - 1];
      carryoverRate = totalScope > 0 ? ((totalScope - completed) / totalScope) * 100 : 0;
    }
  }

  return {
    completionRate,
    averageCycleTime,
    weeklyThroughput,
    carryoverRate,
    previousCompletionRate,
    previousAverageCycleTime,
    previousWeeklyThroughput,
    previousCarryoverRate: previousCarryoverRate,
  };
}

// --- Velocity ---

export function calculateVelocityData(
  cycles: Omit<LinearCycle, "issues">[]
): VelocityDataPoint[] {
  return cycles.map((cycle) => {
    const scope = cycle.completedScopeHistory;
    const issueCount = cycle.completedIssueCountHistory;
    const totalScope = cycle.scopeHistory;
    const totalIssues = cycle.issueCountHistory;

    return {
      cycleNumber: cycle.number,
      cycleName: cycle.name ?? `Cycle ${cycle.number}`,
      completedPoints: scope.length > 0 ? scope[scope.length - 1] : 0,
      totalPoints:
        totalScope.length > 0 ? totalScope[totalScope.length - 1] : 0,
      completedIssues:
        issueCount.length > 0 ? issueCount[issueCount.length - 1] : 0,
      totalIssues:
        totalIssues.length > 0 ? totalIssues[totalIssues.length - 1] : 0,
    };
  });
}

// --- Status Distribution ---

export function calculateStatusDistribution(
  issues: LinearIssue[]
): StatusDistribution[] {
  const activeIssues = issues.filter((i) => !i.archivedAt);
  const distribution = new Map<
    string,
    { type: LinearIssue["state"]["type"]; color: string; count: number }
  >();

  for (const issue of activeIssues) {
    const existing = distribution.get(issue.state.name);
    if (existing) {
      existing.count++;
    } else {
      distribution.set(issue.state.name, {
        type: issue.state.type,
        color: issue.state.color,
        count: 1,
      });
    }
  }

  return Array.from(distribution.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
}

// --- Priority Distribution ---

export function calculatePriorityDistribution(
  issues: LinearIssue[]
): PriorityDistribution[] {
  const activeIssues = issues.filter(
    (i) => !i.archivedAt && i.state.type !== "completed" && i.state.type !== "canceled"
  );
  const counts = new Map<number, number>();

  for (const issue of activeIssues) {
    counts.set(issue.priority, (counts.get(issue.priority) ?? 0) + 1);
  }

  return [1, 2, 3, 4, 0]
    .filter((p) => counts.has(p))
    .map((priority) => ({
      priority,
      label: PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].label,
      count: counts.get(priority) ?? 0,
      color: PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG].color,
    }));
}

// --- Burndown ---

export function calculateBurndownData(
  cycle: Omit<LinearCycle, "issues">
): BurndownDataPoint[] {
  const { scopeHistory, completedScopeHistory, inProgressScopeHistory } = cycle;
  const days = scopeHistory.length;
  if (days === 0) return [];

  const initialScope = scopeHistory[0];
  const startDate = new Date(cycle.startsAt);

  return scopeHistory.map((scope, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const completed = completedScopeHistory[i] ?? 0;
    const inProgress = inProgressScopeHistory[i] ?? 0;
    const idealRemaining = initialScope - (initialScope / (days - 1)) * i;

    return {
      day: i + 1,
      date: date.toISOString().split("T")[0],
      remaining: scope - completed,
      ideal: Math.max(idealRemaining, 0),
      scope,
      completed,
      inProgress,
    };
  });
}

// --- Member Workload ---

export function calculateMemberWorkload(
  issues: LinearIssue[],
  members: LinearUser[]
): MemberWorkload[] {
  return members.map((member) => {
    const memberIssues = issues.filter(
      (i) => i.assignee?.id === member.id && !i.archivedAt
    );
    const completed = memberIssues.filter(
      (i) => i.state.type === "completed"
    );
    const inProgress = memberIssues.filter(
      (i) => i.state.type === "started"
    );

    const cycleTimes = completed
      .map(calculateCycleTime)
      .filter((ct): ct is number => ct !== null);

    return {
      user: member,
      assignedCount: memberIssues.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      totalEstimate: memberIssues.reduce((sum, i) => sum + (i.estimate ?? 0), 0),
      completedEstimate: completed.reduce(
        (sum, i) => sum + (i.estimate ?? 0),
        0
      ),
      averageCycleTime:
        cycleTimes.length > 0
          ? cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length
          : null,
    };
  });
}

// --- Cycle Time Scatter ---

export function calculateCycleTimeScatter(
  issues: LinearIssue[]
): CycleTimeDataPoint[] {
  return issues
    .filter((i) => i.completedAt)
    .map((issue) => ({
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      completedAt: issue.completedAt!,
      cycleTimeDays: calculateCycleTime(issue) ?? 0,
    }))
    .filter((d) => d.cycleTimeDays > 0)
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
}

// --- Scope Creep ---

export function calculateScopeCreep(
  cycle: Omit<LinearCycle, "issues">
): number {
  const { scopeHistory } = cycle;
  if (scopeHistory.length < 2) return 0;

  const initial = scopeHistory[0];
  const current = scopeHistory[scopeHistory.length - 1];

  return initial > 0 ? ((current - initial) / initial) * 100 : 0;
}

// --- Actionable Insights ---

export function generateInsights(
  kpi: KpiMetrics,
  scopeCreep: number,
  issues: LinearIssue[],
  members: LinearUser[]
): InsightMessage[] {
  const insights: InsightMessage[] = [];

  // Carryover rate
  if (kpi.carryoverRate > THRESHOLDS.carryoverRate.danger) {
    insights.push({
      type: "danger",
      title: "キャリーオーバー率が高い",
      message: `キャリーオーバー率が${kpi.carryoverRate.toFixed(0)}%です。見積もり精度の見直しを検討してください。`,
    });
  } else if (kpi.carryoverRate > THRESHOLDS.carryoverRate.warning) {
    insights.push({
      type: "warning",
      title: "キャリーオーバー率に注意",
      message: `キャリーオーバー率が${kpi.carryoverRate.toFixed(0)}%です。タスクの優先順位付けを確認してください。`,
    });
  }

  // Scope creep
  if (scopeCreep > THRESHOLDS.scopeCreep.danger) {
    insights.push({
      type: "danger",
      title: "スコープクリープが発生",
      message: `サイクル中にスコープが${scopeCreep.toFixed(0)}%増加しています。要件整理を検討してください。`,
    });
  } else if (scopeCreep > THRESHOLDS.scopeCreep.warning) {
    insights.push({
      type: "warning",
      title: "スコープの増加傾向",
      message: `サイクル中にスコープが${scopeCreep.toFixed(0)}%増加しています。`,
    });
  }

  // WIP per member
  const activeIssues = issues.filter(
    (i) => i.state.type === "started" && i.assignee
  );
  const wipByMember = new Map<string, number>();
  for (const issue of activeIssues) {
    if (issue.assignee) {
      wipByMember.set(
        issue.assignee.id,
        (wipByMember.get(issue.assignee.id) ?? 0) + 1
      );
    }
  }
  for (const [memberId, wip] of wipByMember) {
    if (wip > THRESHOLDS.wipPerMember.danger) {
      const member = members.find((m) => m.id === memberId);
      insights.push({
        type: "danger",
        title: "WIPリミット超過",
        message: `${member?.name ?? "メンバー"}の担当タスクが${wip}件集中しています。再配分を検討してください。`,
      });
    }
  }

  // Cycle time increase
  if (
    kpi.previousAverageCycleTime &&
    kpi.averageCycleTime >
      kpi.previousAverageCycleTime * THRESHOLDS.cycleTimeMultiplier.warning
  ) {
    insights.push({
      type: "warning",
      title: "サイクルタイムの増加",
      message: `平均サイクルタイムが前期比${((kpi.averageCycleTime / kpi.previousAverageCycleTime) * 100 - 100).toFixed(0)}%増加しています。ブロッカーを確認してください。`,
    });
  }

  // Bug rate
  const completedIssues = issues.filter((i) => i.state.type === "completed");
  const bugIssues = completedIssues.filter((i) =>
    i.labels.some((l) => l.name.toLowerCase() === "bug")
  );
  const bugRate =
    completedIssues.length > 0
      ? (bugIssues.length / completedIssues.length) * 100
      : 0;
  if (bugRate > THRESHOLDS.bugRate.danger) {
    insights.push({
      type: "danger",
      title: "バグ率が高い",
      message: `バグの割合が${bugRate.toFixed(0)}%です。品質改善施策を検討してください。`,
    });
  }

  // Positive insight
  if (insights.length === 0) {
    insights.push({
      type: "success",
      title: "良好な状態",
      message: "現在のメトリクスは全て正常範囲内です。この調子を維持しましょう。",
    });
  }

  return insights;
}

// --- Cumulative Flow Diagram ---

export function calculateCfdData(
  issues: LinearIssue[],
  states: LinearWorkflowState[],
  days: number = 30
): CfdDataPoint[] {
  const now = new Date();
  const sortedStates = [...states].sort((a, b) => a.position - b.position);
  const stateNames = sortedStates.map((s) => s.name);

  const result: CfdDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(23, 59, 59, 999);
    const dateStr = date.toISOString().split("T")[0];

    const point: CfdDataPoint = { date: dateStr };

    for (const name of stateNames) {
      point[name] = 0;
    }

    for (const issue of issues) {
      const created = new Date(issue.createdAt);
      if (created > date) continue;

      if (issue.completedAt && new Date(issue.completedAt) <= date) {
        point[issue.state.name] = (point[issue.state.name] as number ?? 0) + 1;
        continue;
      }

      if (issue.canceledAt && new Date(issue.canceledAt) <= date) {
        continue;
      }

      point[issue.state.name] = (point[issue.state.name] as number ?? 0) + 1;
    }

    result.push(point);
  }

  return result;
}

// --- Status Dwell Time ---

export function calculateStatusDwellTime(
  issues: LinearIssue[],
  states: LinearWorkflowState[]
): StatusDwellTime[] {
  const completedIssues = issues.filter((i) => i.completedAt);

  const dwellByState = new Map<string, { total: number; count: number; color: string }>();

  for (const state of states) {
    dwellByState.set(state.name, { total: 0, count: 0, color: state.color });
  }

  for (const issue of completedIssues) {
    const cycleTime = calculateCycleTime(issue);
    if (cycleTime === null) continue;

    const entry = dwellByState.get(issue.state.name);
    if (entry) {
      entry.total += cycleTime;
      entry.count += 1;
    }
  }

  const stateIssueCount = new Map<string, number>();
  for (const issue of issues.filter((i) => !i.archivedAt)) {
    stateIssueCount.set(
      issue.state.name,
      (stateIssueCount.get(issue.state.name) ?? 0) + 1
    );
  }

  const results: StatusDwellTime[] = [];
  for (const state of states) {
    const entry = dwellByState.get(state.name);
    if (!entry) continue;
    const avg = entry.count > 0 ? entry.total / entry.count : 0;
    results.push({
      name: state.name,
      color: state.color,
      averageDays: avg,
      issueCount: stateIssueCount.get(state.name) ?? 0,
      isAnomaly: false,
    });
  }

  const overallAvg =
    results.reduce((s, r) => s + r.averageDays, 0) /
    Math.max(results.filter((r) => r.averageDays > 0).length, 1);

  for (const r of results) {
    r.isAnomaly = r.averageDays > overallAvg * 2;
  }

  return results;
}

// --- Lead Time Histogram ---

export function calculateLeadTimeHistogram(
  issues: LinearIssue[],
  binCount: number = 10
): { bins: LeadTimeHistogramBin[]; median: number; p85: number; p95: number } {
  const leadTimes = issues
    .map(calculateLeadTime)
    .filter((lt): lt is number => lt !== null && lt > 0)
    .sort((a, b) => a - b);

  if (leadTimes.length === 0) {
    return { bins: [], median: 0, p85: 0, p95: 0 };
  }

  const median = percentile(leadTimes, 50);
  const p85 = percentile(leadTimes, 85);
  const p95 = percentile(leadTimes, 95);

  const min = leadTimes[0];
  const max = leadTimes[leadTimes.length - 1];
  const binWidth = Math.max(Math.ceil((max - min) / binCount), 1);

  const bins: LeadTimeHistogramBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const binMin = min + i * binWidth;
    const binMax = binMin + binWidth;
    const count = leadTimes.filter((lt) => lt >= binMin && lt < binMax).length;
    bins.push({
      range: `${binMin}-${binMax}`,
      min: binMin,
      max: binMax,
      count,
    });
  }

  return { bins, median, p85, p95 };
}

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// --- Risk Issues ---

export function detectRiskIssues(
  issues: LinearIssue[]
): RiskIssue[] {
  const now = new Date();
  const risks: RiskIssue[] = [];

  for (const issue of issues) {
    if (issue.archivedAt || issue.state.type === "completed" || issue.state.type === "canceled") {
      continue;
    }

    if (issue.dueDate && new Date(issue.dueDate) < now) {
      risks.push({
        issue,
        reason: "overdue",
        detail: `期限 ${formatSimpleDate(issue.dueDate)} を超過`,
      });
    }

    if (issue.state.type === "started" && issue.startedAt) {
      const daysInProgress = businessDaysBetween(new Date(issue.startedAt), now);
      if (daysInProgress >= 5) {
        risks.push({
          issue,
          reason: "stale_wip",
          detail: `${daysInProgress} 営業日間 In Progress`,
        });
      }
    }

    if (
      (issue.priority === 1 || issue.priority === 2) &&
      (issue.state.type === "backlog" || issue.state.type === "unstarted" || issue.state.type === "triage")
    ) {
      risks.push({
        issue,
        reason: "high_priority_unstarted",
        detail: `${issue.priorityLabel} 優先度で未着手`,
      });
    }
  }

  return risks.sort((a, b) => a.issue.priority - b.issue.priority);
}

function formatSimpleDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
