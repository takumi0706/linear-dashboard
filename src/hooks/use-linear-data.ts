"use client";

import { useQuery } from "@tanstack/react-query";
import { linearGraphQL } from "@/lib/linear/client";
import {
  VIEWER_QUERY,
  TEAMS_QUERY,
  TEAM_MEMBERS_QUERY,
  TEAM_STATES_QUERY,
  TEAM_LABELS_QUERY,
  TEAM_ISSUES_QUERY,
  TEAM_CYCLES_QUERY,
  CYCLE_ISSUES_QUERY,
  TEAM_PROJECTS_QUERY,
} from "@/lib/linear/queries";
import { REFRESH_INTERVALS } from "@/lib/constants";
import type {
  LinearUser,
  LinearIssue,
  LinearCycle,
  LinearProject,
  LinearWorkflowState,
  LinearLabel,
  LinearAttachment,
} from "@/lib/linear/types";

// --- Viewer ---

interface ViewerResponse {
  viewer: LinearUser;
}

export function useViewer() {
  return useQuery({
    queryKey: ["viewer"],
    queryFn: () => linearGraphQL<ViewerResponse>(VIEWER_QUERY),
    select: (data) => data.viewer,
    staleTime: REFRESH_INTERVALS.gcTime,
  });
}

// --- Teams ---

interface TeamsResponse {
  teams: { nodes: Array<{ id: string; name: string; key: string }> };
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => linearGraphQL<TeamsResponse>(TEAMS_QUERY),
    select: (data) => data.teams.nodes,
    staleTime: REFRESH_INTERVALS.gcTime,
  });
}

// --- Team Members ---

interface TeamMembersResponse {
  team: { members: { nodes: LinearUser[] } };
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () =>
      linearGraphQL<TeamMembersResponse>(TEAM_MEMBERS_QUERY, { teamId }),
    select: (data) => data.team.members.nodes,
    enabled: !!teamId,
  });
}

// --- Team States ---

interface TeamStatesResponse {
  team: { states: { nodes: LinearWorkflowState[] } };
}

export function useTeamStates(teamId: string | null) {
  return useQuery({
    queryKey: ["team-states", teamId],
    queryFn: () =>
      linearGraphQL<TeamStatesResponse>(TEAM_STATES_QUERY, { teamId }),
    select: (data) =>
      data.team.states.nodes.sort((a, b) => a.position - b.position),
    enabled: !!teamId,
  });
}

// --- Team Labels ---

interface TeamLabelsResponse {
  team: { labels: { nodes: LinearLabel[] } };
}

export function useTeamLabels(teamId: string | null) {
  return useQuery({
    queryKey: ["team-labels", teamId],
    queryFn: () =>
      linearGraphQL<TeamLabelsResponse>(TEAM_LABELS_QUERY, { teamId }),
    select: (data) => data.team.labels.nodes,
    enabled: !!teamId,
  });
}

// --- Team Issues ---

interface IssueNode extends Omit<LinearIssue, "labels" | "attachments"> {
  labels: { nodes: LinearLabel[] };
  attachments: { nodes: LinearAttachment[] };
}

interface TeamIssuesResponse {
  team: {
    issues: {
      nodes: IssueNode[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
}

function flattenIssueNode(issue: IssueNode): LinearIssue {
  return {
    ...issue,
    labels: issue.labels.nodes,
    attachments: issue.attachments.nodes,
  };
}

export function useTeamIssues(teamId: string | null) {
  return useQuery({
    queryKey: ["team-issues", teamId],
    queryFn: () =>
      linearGraphQL<TeamIssuesResponse>(TEAM_ISSUES_QUERY, { teamId }),
    select: (data) => data.team.issues.nodes.map(flattenIssueNode),
    enabled: !!teamId,
    refetchInterval: REFRESH_INTERVALS.auto,
    refetchIntervalInBackground: false,
  });
}

// --- Team Cycles ---

interface TeamCyclesResponse {
  team: { cycles: { nodes: Omit<LinearCycle, "issues">[] } };
}

export function useTeamCycles(teamId: string | null) {
  return useQuery({
    queryKey: ["team-cycles", teamId],
    queryFn: () =>
      linearGraphQL<TeamCyclesResponse>(TEAM_CYCLES_QUERY, { teamId }),
    select: (data) =>
      data.team.cycles.nodes.sort((a, b) => a.number - b.number),
    enabled: !!teamId,
    refetchInterval: REFRESH_INTERVALS.auto,
    refetchIntervalInBackground: false,
  });
}

// --- Cycle Issues ---

interface CycleIssueNode extends Omit<LinearIssue, "labels"> {
  labels: { nodes: LinearLabel[] };
}

interface CycleIssuesResponse {
  cycle: { issues: { nodes: CycleIssueNode[] } };
}

export function useCycleIssues(cycleId: string | null) {
  return useQuery({
    queryKey: ["cycle-issues", cycleId],
    queryFn: () =>
      linearGraphQL<CycleIssuesResponse>(CYCLE_ISSUES_QUERY, { cycleId }),
    select: (data) =>
      data.cycle.issues.nodes.map((issue) => ({
        ...issue,
        labels: issue.labels.nodes,
      })),
    enabled: !!cycleId,
    refetchInterval: REFRESH_INTERVALS.auto,
    refetchIntervalInBackground: false,
  });
}

// --- Team Projects ---

interface TeamProjectsResponse {
  team: { projects: { nodes: Omit<LinearProject, "issues">[] } };
}

export function useTeamProjects(teamId: string | null) {
  return useQuery({
    queryKey: ["team-projects", teamId],
    queryFn: () =>
      linearGraphQL<TeamProjectsResponse>(TEAM_PROJECTS_QUERY, { teamId }),
    select: (data) => data.team.projects.nodes,
    enabled: !!teamId,
    refetchInterval: REFRESH_INTERVALS.auto,
    refetchIntervalInBackground: false,
  });
}
