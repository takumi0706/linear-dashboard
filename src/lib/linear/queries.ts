export const VIEWER_QUERY = `
  query Viewer {
    viewer {
      id
      name
      email
      avatarUrl
      displayName
    }
  }
`;

export const TEAMS_QUERY = `
  query Teams {
    teams {
      nodes {
        id
        name
        key
      }
    }
  }
`;

export const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamId: String!) {
    team(id: $teamId) {
      members {
        nodes {
          id
          name
          email
          avatarUrl
          displayName
        }
      }
    }
  }
`;

export const TEAM_STATES_QUERY = `
  query TeamStates($teamId: String!) {
    team(id: $teamId) {
      states {
        nodes {
          id
          name
          type
          color
          position
        }
      }
    }
  }
`;

export const TEAM_LABELS_QUERY = `
  query TeamLabels($teamId: String!) {
    team(id: $teamId) {
      labels {
        nodes {
          id
          name
          color
        }
      }
    }
  }
`;

export const TEAM_ISSUES_QUERY = `
  query TeamIssues($teamId: String!, $first: Int = 250, $after: String) {
    team(id: $teamId) {
      issues(first: $first, after: $after, orderBy: updatedAt) {
        nodes {
          id
          identifier
          title
          description
          priority
          priorityLabel
          estimate
          state {
            id
            name
            type
            color
            position
          }
          assignee {
            id
            name
            email
            avatarUrl
            displayName
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          createdAt
          updatedAt
          startedAt
          completedAt
          canceledAt
          archivedAt
          dueDate
          url
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export const TEAM_CYCLES_QUERY = `
  query TeamCycles($teamId: String!, $first: Int = 20) {
    team(id: $teamId) {
      cycles(first: $first, orderBy: createdAt) {
        nodes {
          id
          number
          name
          startsAt
          endsAt
          progress
          scopeHistory
          completedScopeHistory
          inProgressScopeHistory
          issueCountHistory
          completedIssueCountHistory
        }
      }
    }
  }
`;

export const CYCLE_ISSUES_QUERY = `
  query CycleIssues($cycleId: String!, $first: Int = 250) {
    cycle(id: $cycleId) {
      issues(first: $first) {
        nodes {
          id
          identifier
          title
          priority
          priorityLabel
          estimate
          state {
            id
            name
            type
            color
            position
          }
          assignee {
            id
            name
            email
            avatarUrl
            displayName
          }
          labels {
            nodes {
              id
              name
              color
            }
          }
          createdAt
          updatedAt
          startedAt
          completedAt
          canceledAt
          dueDate
          url
        }
      }
    }
  }
`;

export const TEAM_PROJECTS_QUERY = `
  query TeamProjects($teamId: String!, $first: Int = 50) {
    team(id: $teamId) {
      projects(first: $first) {
        nodes {
          id
          name
          description
          state
          progress
          startedAt
          targetDate
          completedAt
          url
          lead {
            id
            name
            email
            avatarUrl
            displayName
          }
        }
      }
    }
  }
`;
