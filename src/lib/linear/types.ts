// Linear API response types

export interface LinearUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  displayName: string;
}

export interface LinearWorkflowState {
  id: string;
  name: string;
  type: "triage" | "backlog" | "unstarted" | "started" | "completed" | "canceled";
  color: string;
  position: number;
}

export interface LinearLabel {
  id: string;
  name: string;
  color: string;
}

export interface LinearAttachment {
  id: string;
  title: string | null;
  url: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number;
  priorityLabel: string;
  estimate: number | null;
  state: LinearWorkflowState;
  assignee: LinearUser | null;
  labels: LinearLabel[];
  project: { id: string; name: string } | null;
  attachments: LinearAttachment[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  archivedAt: string | null;
  dueDate: string | null;
  cycleId: string | null;
  url: string;
}

export interface LinearCycle {
  id: string;
  number: number;
  name: string | null;
  startsAt: string;
  endsAt: string;
  progress: number;
  scopeHistory: number[];
  completedScopeHistory: number[];
  inProgressScopeHistory: number[];
  issueCountHistory: number[];
  completedIssueCountHistory: number[];
  issues: LinearIssue[];
}

export interface LinearProject {
  id: string;
  name: string;
  description: string | null;
  state: string;
  progress: number;
  startedAt: string | null;
  targetDate: string | null;
  completedAt: string | null;
  url: string;
  lead: LinearUser | null;
  issues: LinearIssue[];
}

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  members: LinearUser[];
  states: LinearWorkflowState[];
  labels: LinearLabel[];
}

// Computed metrics types

export interface KpiMetrics {
  completionRate: number;
  averageCycleTime: number;
  weeklyThroughput: number;
  carryoverRate: number;
  previousCompletionRate: number | null;
  previousAverageCycleTime: number | null;
  previousWeeklyThroughput: number | null;
  previousCarryoverRate: number | null;
}

export interface VelocityDataPoint {
  cycleNumber: number;
  cycleName: string;
  completedPoints: number;
  totalPoints: number;
  completedIssues: number;
  totalIssues: number;
}

export interface MemberWorkload {
  user: LinearUser;
  assignedCount: number;
  completedCount: number;
  inProgressCount: number;
  totalEstimate: number;
  completedEstimate: number;
  averageCycleTime: number | null;
}

export interface StatusDistribution {
  name: string;
  type: LinearWorkflowState["type"];
  color: string;
  count: number;
}

export interface PriorityDistribution {
  priority: number;
  label: string;
  count: number;
  color: string;
}

export interface BurndownDataPoint {
  day: number;
  date: string;
  remaining: number;
  ideal: number;
  scope: number;
  completed: number;
  inProgress: number;
}

export interface CycleTimeDataPoint {
  issueId: string;
  identifier: string;
  title: string;
  completedAt: string;
  cycleTimeDays: number;
}

export interface InsightMessage {
  type: "warning" | "danger" | "info" | "success";
  title: string;
  message: string;
}

// Workflow analysis types

export interface CfdDataPoint {
  date: string;
  [statusName: string]: number | string;
}

export interface StatusDwellTime {
  name: string;
  color: string;
  averageDays: number;
  issueCount: number;
  isAnomaly: boolean;
}

export interface LeadTimeHistogramBin {
  range: string;
  min: number;
  max: number;
  count: number;
}

export interface RiskIssue {
  issue: LinearIssue;
  reason: "overdue" | "stale_wip" | "high_priority_unstarted";
  detail: string;
}

// Auth types

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

export interface AuthSession {
  user: LinearUser;
  tokens: AuthTokens;
}
