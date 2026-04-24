import { CURRENTS_API_BASE, DEVELOP_BRANCH, TEST_RESULTS_PAGE_SIZE } from './config';
import { SpecFetchMode } from './types';
import type {
    Action,
    ActionStatus,
    ActionsListResponse,
    RawInstanceTest,
    RunData,
    RunResponse,
    RunTest,
    TestExplorerItem,
    TestResultItem,
    TestResultsResponse,
    TestsExplorerResponse,
} from './types';
import { debug, warn } from '../logger';

function getApiKey(): string {
    const key = process.env.CURRENTS_API_KEY;
    if (!key) throw new Error('CURRENTS_API_KEY env var is not set');

    return key;
}

export async function currentsRequest<T>(
    path: string,
    options: RequestInit = {},
    retries = 3,
): Promise<T> {
    const url = `${CURRENTS_API_BASE}${path}`;
    debug(`  → ${options.method ?? 'GET'} ${url}`);
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${getApiKey()}`,
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        },
    });

    // Handle rate limiting (HTTP 429) with exponential back-off
    if (res.status === 429 && retries > 0) {
        const retryAfter = res.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 10_000 * (4 - retries);
        warn(
            `  [rate-limit] 429 received for ${url}. Waiting ${waitMs}ms before retry (${retries} left)…`,
        );
        await new Promise(resolve => setTimeout(resolve, waitMs));

        return currentsRequest<T>(path, options, retries - 1);
    }

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Currents API ${options.method ?? 'GET'} ${url} → ${res.status}: ${body}`);
    }

    const json = (await res.json()) as T;
    debug(`  ← ${res.status} ${options.method ?? 'GET'} ${url}`, JSON.stringify(json));

    return json;
}

/**
 * Async generator that yields pages of completed (non-pending) test results
 * for the given signature, newest-first, via cursor-based pagination.
 * Pending results are stripped — they represent incomplete runs and would
 * skew failure-rate calculations.
 */
export async function* paginateTestResults(
    signature: string,
    lookbackDays: number,
): AsyncGenerator<TestResultItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    const baseParams = [
        `date_start=${dateStart.toISOString()}`,
        `date_end=${dateEnd.toISOString()}`,
        `limit=${TEST_RESULTS_PAGE_SIZE}`,
    ];
    let cursor: string | undefined;
    let pageIndex = 0;

    do {
        const queryParts = [...baseParams, ...(cursor ? [`starting_after=${cursor}`] : [])];
        debug(
            `  paginateTestResults: signature=${signature.slice(0, 20)}… page=${pageIndex}`,
            cursor ? `cursor=${cursor.slice(0, 16)}…` : '(first page)',
        );
        const response = await currentsRequest<TestResultsResponse>(
            `/test-results/${signature}?${queryParts.join('&')}`,
        );
        const completed = response.data.filter(r => r.status !== 'pending');
        debug(
            `  paginateTestResults: page=${pageIndex} raw=${response.data.length} completed=${completed.length} has_more=${response.has_more}`,
        );
        yield completed;
        cursor = response.has_more ? response.data.at(-1)?.cursor : undefined;
        pageIndex++;
    } while (cursor);
}

/**
 * Fetch the latest N completed execution results for a specific test signature.
 * Results are returned newest-first.
 */
export async function getLastNResults(
    signature: string,
    numberOfResults: number,
    lookbackDays: number,
): Promise<TestResultItem[]> {
    const results: TestResultItem[] = [];
    for await (const page of paginateTestResults(signature, lookbackDays)) {
        results.push(...page);
        if (results.length >= numberOfResults) {
            break;
        }
    }

    return results.slice(0, numberOfResults);
}

/**
 * Fetch completed results and pick the first `n` that come from distinct branches.
 * Results are processed newest-first. Multiple results from `develop` are always
 * allowed; every other branch contributes at most one result to the selection.
 */
export async function getLastNResultsFromDistinctBranches(
    signature: string,
    numberOfResults: number,
    lookbackDays: number,
): Promise<TestResultItem[]> {
    const uniqueBranchesSet = new Set<string>();
    const picked: TestResultItem[] = [];

    for await (const page of paginateTestResults(signature, lookbackDays)) {
        for (const result of page) {
            const { branch } = result.commit;
            const branchNotIncludedYet = !uniqueBranchesSet.has(branch);
            if (branch === DEVELOP_BRANCH || branchNotIncludedYet) {
                uniqueBranchesSet.add(branch);
                picked.push(result);
                debug(
                    `  getLastNResultsFromDistinctBranches: picked branch=${branch} picked=${picked.length}/${numberOfResults}`,
                );
                if (picked.length >= numberOfResults) {
                    return picked;
                }
            } else {
                debug(
                    `  getLastNResultsFromDistinctBranches: skipped branch=${branch} (already included)`,
                );
            }
        }
    }

    return picked;
}

/**
 * Fetch all pages from the Tests Explorer for a given project.
 * Used only to enumerate active tests and obtain their signatures.
 */
export async function getActiveTests(
    projectId: string,
    lookbackDays: number,
): Promise<TestExplorerItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

    // The Currents API only accepts date-only strings (YYYY-MM-DD); time components are ignored/rejected
    const toDateString = (d: Date) => d.toISOString().slice(0, 10);

    const items: TestExplorerItem[] = [];
    let page = 0;
    let response: TestsExplorerResponse;
    const limit = 25;

    do {
        const queryString = [
            `date_start=${toDateString(dateStart)}`,
            `date_end=${toDateString(dateEnd)}`,
            `order=failRateXSamples`,
            `dir=desc`,
            `page=${page}`,
            `limit=${limit}`,
        ].join('&');

        debug(`  getActiveTests: project=${projectId} page=${page} (${items.length} items so far)`);
        response = await currentsRequest<TestsExplorerResponse>(
            `/tests/${projectId}?${queryString}`,
        );

        items.push(...response.data.list);
        debug(
            `  getActiveTests: page=${page} items=${response.data.list.length} nextPage=${response.data.nextPage} cumulative=${items.length}`,
        );
        page++;
    } while (response.data.nextPage);

    return items;
}

/**
 * Fetch actions for a project, optionally filtered by status.
 */
export async function getActions(
    projectId: string,
    status?: ActionStatus | ActionStatus[],
): Promise<Action[]> {
    const params = new URLSearchParams({ projectId });
    if (status !== undefined) {
        const statuses = Array.isArray(status) ? status : [status];
        statuses.forEach(s => params.append('status', s));
    }
    const response = await currentsRequest<ActionsListResponse>(`/actions?${params.toString()}`);

    return response.data;
}

/**
 * Fetch active actions for a project that have a quarantine rule applied.
 */
export async function getAllQuarantineActions(projectId: string): Promise<Action[]> {
    const actions = await getActions(projectId, 'active');

    return actions.filter(a => a.action.some(r => r.op === 'quarantine'));
}

/**
 * Delete (remove) an action.
 */
export async function deleteAction(actionId: string): Promise<void> {
    await currentsRequest(`/actions/${actionId}`, { method: 'DELETE' });
}

/**
 * Create an action for a project.
 */
export function createAction(
    projectId: string,
    body: Omit<Action, 'actionId' | 'status' | 'createdAt'>,
): Promise<Action> {
    return currentsRequest<Action>(`/actions?projectId=${projectId}`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * Fetch the individual test results for a spec instance.
 * Currents stores them separately under GET /instances/{instanceId};
 * the run endpoint only exposes aggregate stats per spec.
 * Normalises the minified `_s` status field into a readable `state`.
 */
async function getInstanceTests(instanceId: string): Promise<RunTest[]> {
    const response = await currentsRequest<{
        status: string;
        data: { results?: { tests?: RawInstanceTest[] } };
    }>(`/instances/${instanceId}`);
    const tests = response.data.results?.tests ?? [];

    return tests.map(t => ({
        testId: t.testId,
        title: t.title,
        state: t._s,
    }));
}

/**
 * Fetch a single run by its ID.
 * Only fetches individual instances for specs that match `mode`, reducing
 * the number of API calls for large runs:
 *  - `SpecFetchMode.FailuresOnly` – only specs with ≥1 failure  (default for manual quarantine)
 *  - `SpecFetchMode.PassesOnly`   – only specs with ≥1 pass     (default for nightly unquarantine)
 *  - `SpecFetchMode.All`          – fetch every instance
 */
export async function getRunById(runId: string, mode: SpecFetchMode): Promise<RunData> {
    const response = await currentsRequest<RunResponse>(`/runs/${runId}`);
    const run = response.data;

    const specsToFetch = run.specs.filter(spec => {
        const stats = spec.results?.stats;
        if (mode === SpecFetchMode.FailuresOnly) return (stats?.failures ?? 0) > 0;
        if (mode === SpecFetchMode.PassesOnly) return (stats?.passes ?? 0) > 0;

        return true;
    });

    debug(
        `  getRunById: runId=${runId} mode=${mode}`,
        `total specs=${run.specs.length} fetching=${specsToFetch.length}`,
    );

    await Promise.all(
        specsToFetch.map(async spec => {
            const tests = await getInstanceTests(spec.instanceId);
            spec.results = { ...spec.results, tests };
        }),
    );

    return run;
}

/**
 * Fetch just the run ID for the latest completed run on the specified branch,
 * without loading any spec instance details. Returns null if no run exists.
 */
export async function getLatestRunIdOnBranch(
    projectId: string,
    branch: string,
): Promise<string | null> {
    const query = [`projectId=${projectId}`, `branch=${encodeURIComponent(branch)}`].join('&');
    try {
        const response = await currentsRequest<RunResponse>(`/runs/find?${query}`);

        return response.data.runId;
    } catch (err) {
        if (err instanceof Error && err.message.includes('→ 404:')) {
            return null;
        }
        throw err;
    }
}

/**
 * Fetch all individual test-result entries for `signature` that belong to
 * the given `runId`. Paginates within the lookback window and stops as soon
 * as a full page contains no entries from the target run (results are
 * newest-first and run entries cluster together in time).
 */
export async function getResultsFromRun(
    signature: string,
    runId: string,
    lookbackDays: number,
): Promise<TestResultItem[]> {
    const results: TestResultItem[] = [];
    let pagesScanned = 0;
    for await (const page of paginateTestResults(signature, lookbackDays)) {
        const matching = page.filter(r => r.runId === runId);
        results.push(...matching);
        pagesScanned++;
        // Once we see a non-empty page with no matching entries the run has
        // scrolled out of view — no need to paginate further.
        if (page.length > 0 && matching.length === 0) {
            debug(
                `  getResultsFromRun: early exit after ${pagesScanned} page(s) — no matches in last page`,
            );
            break;
        }
    }
    debug(
        `  getResultsFromRun: signature=${signature.slice(0, 20)}… runId=${runId}`,
        `pages=${pagesScanned} results=${results.length}`,
    );

    return results;
}
