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

export type RuleMatcherConditionOp =
    // Primitive types (title, testId, project, file, git_*, …)
    | 'eq'
    | 'neq'
    | 'any'
    | 'empty'
    | 'in'
    | 'notIn'
    // Complex types (titlePath, error_message, annotation, tag)
    | 'inc'
    | 'notInc'
    | 'incAll'
    | 'notIncAll';

export interface RuleMatcherCondition {
    type: string;
    op: RuleMatcherConditionOp;
    value: string | string[];
}

export interface RuleMatcher {
    op: 'AND' | 'OR';
    cond: RuleMatcherCondition[];
}

export interface RuleAction {
    op: 'skip' | 'quarantine' | 'tag';
    details?: { tags: string[] };
}

export type ActionStatus = 'active' | 'disabled' | 'archived' | 'expired';

export interface Action {
    actionId: string;
    name: string;
    description: string;
    action: RuleAction[];
    matcher: RuleMatcher;
    status: ActionStatus;
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

export interface RunTest {
    testId: string | undefined;
    /** Title parts as returned by Currents: [describe, ..., test-name]. */
    title: string[];
    state: 'passed' | 'failed' | 'pending' | 'skipped';
}

/**
 * Raw test shape returned by GET /v1/instances/{instanceId}.
 * Currents uses short/minified field names; `_s` is the test state.
 */
export interface RawInstanceTest {
    _s: 'passed' | 'failed' | 'pending' | 'skipped';
    testId: string | undefined;
    title: string[];
    spec: string;
}

export interface RunSpec {
    instanceId: string;
    spec: string;
    /** Aggregate stats returned directly by the run endpoint. */
    results?: {
        stats?: { failures?: number; passes?: number };
        tests?: RunTest[];
    };
}

export interface RunData {
    runId: string;
    projectId: string;
    specs: RunSpec[];
}

export interface RunResponse {
    status: string;
    data: RunData;
}

export interface RunListItem {
    runId: string;
    projectId: string;
}

export interface RunsListResponse {
    status: string;
    data: RunListItem[];
}

/**
 * Controls which spec instances are fetched when loading a run.
 * Only specs matching the filter have their individual test results hydrated;
 * the rest are left with stats only (reducing API calls).
 */
export enum SpecFetchMode {
    /** Fetch instances only for specs with ≥1 failure (used by manual quarantine). */
    FailuresOnly = 'failures-only',
    /** Fetch instances only for specs with ≥1 pass (used by nightly unquarantine). */
    PassesOnly = 'passes-only',
    /** Fetch every instance regardless. */
    All = 'all',
}
