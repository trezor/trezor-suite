export interface TestExplorerMetrics {
    executions: number;
    failures: number;
    passes: number;
    failureRate: number;
    flakinessRate: number;
    flaky: number;
    ignored: number;
    avgDurationMs: number;
    flakinessVolume: number;
    failureVolume: number;
    durationVolume: number;
}

export interface TestExplorerItem {
    title: string;
    titlePath?: string[];
    spec: string;
    signature?: string;
    latestTag?: string[];
    lastSeen?: string;
    metrics: TestExplorerMetrics;
}

export interface TestsExplorerResponse {
    status: string;
    data: {
        list: TestExplorerItem[];
        count: number;
        total: number;
        nextPage: boolean;
    };
}

export interface RuleMatcherCondition {
    type: string;
    op: string;
    value: string | string[];
}

export interface RuleMatcher {
    op: string;
    cond: RuleMatcherCondition[];
}

export interface RuleAction {
    op: 'skip' | 'quarantine' | 'tag';
    details?: { tags: string[] };
}

export interface Action {
    actionId: string;
    name: string;
    description: string;
    action: RuleAction[];
    matcher: RuleMatcher;
    status: string;
    createdAt: string;
    expiresAfter?: string;
}

export interface ActionsListResponse {
    status: string;
    data: Action[];
}

export interface TestResultCommit {
    branch: string;
    sha: string;
    authorName: string;
    authorEmail: string;
    message: string;
}

export interface TestResultItem {
    cursor: string;
    signature: string;
    createdAt: string;
    runId: string;
    instanceId: string;
    spec: string;
    status: 'passed' | 'failed' | 'pending' | 'skipped';
    flaky: boolean;
    commit: TestResultCommit;
    duration: number;
}

export interface TestResultsResponse {
    status: string;
    has_more: boolean;
    data: TestResultItem[];
}

export type SlackEvent =
    | {
          kind: 'quarantined';
          projectId: string;
          titlePath: string[];
          signature: string;
          actionId: string;
          failures: number;
          executions: number;
      }
    | {
          kind: 'unquarantined';
          projectId: string;
          titlePath: string[];
          signature: string;
          passes: number;
          executions: number;
      };
