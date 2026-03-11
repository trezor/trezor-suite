import { computeStats, normalizeTitlePath } from './actions';
import {
    AUTO_QUARANTINE_PREFIX,
    CURRENTS_API_BASE,
    DEVELOP_BRANCH,
    EXPLORER_LOOKBACK_DAYS,
    QUARANTINE_LAST_N_EXECUTIONS,
    TEST_RESULTS_PAGE_SIZE,
} from './config';
import type {
    Action,
    ActionsListResponse,
    TestExplorerItem,
    TestResultItem,
    TestResultsResponse,
    TestsExplorerResponse,
} from './types';

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
        console.warn(
            `  [rate-limit] 429 received for ${url}. Waiting ${waitMs}ms before retry (${retries} left)…`,
        );
        await new Promise(resolve => setTimeout(resolve, waitMs));

        return currentsRequest<T>(path, options, retries - 1);
    }

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Currents API ${options.method ?? 'GET'} ${url} → ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
}

/**
 * Async generator that yields pages of completed (non-pending) test results
 * for the given signature, newest-first, via cursor-based pagination.
 * Pending results are stripped — they represent incomplete runs and would
 * skew failure-rate calculations.
 */
async function* paginateTestResults(signature: string): AsyncGenerator<TestResultItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - EXPLORER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const baseParams = [
        `date_start=${dateStart.toISOString()}`,
        `date_end=${dateEnd.toISOString()}`,
        `limit=${TEST_RESULTS_PAGE_SIZE}`,
    ];
    let cursor: string | undefined;

    do {
        const queryParts = [...baseParams, ...(cursor ? [`starting_after=${cursor}`] : [])];
        const response = await currentsRequest<TestResultsResponse>(
            `/test-results/${signature}?${queryParts.join('&')}`,
        );
        yield response.data.filter(r => r.status !== 'pending');
        cursor = response.has_more ? response.data.at(-1)?.cursor : undefined;
    } while (cursor);
}

/**
 * Fetch the latest N completed execution results for a specific test signature.
 * Results are returned newest-first.
 */
export async function getLastNResults(
    signature: string,
    numberOfResults: number,
): Promise<TestResultItem[]> {
    const results: TestResultItem[] = [];
    for await (const page of paginateTestResults(signature)) {
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
    numberOfResults = QUARANTINE_LAST_N_EXECUTIONS,
): Promise<TestResultItem[]> {
    const uniqueBranchesSet = new Set<string>();
    const picked: TestResultItem[] = [];

    for await (const page of paginateTestResults(signature)) {
        for (const result of page) {
            const { branch } = result.commit;
            const branchNotIncludedYet = !uniqueBranchesSet.has(branch);
            if (branch === DEVELOP_BRANCH || branchNotIncludedYet) {
                uniqueBranchesSet.add(branch);
                picked.push(result);
                if (picked.length >= numberOfResults) {
                    return picked;
                }
            }
        }
    }

    return picked;
}

/**
 * Fetch all pages from the Tests Explorer for a given project.
 * Used only to enumerate active tests and obtain their signatures.
 */
export async function getActiveTests(projectId: string): Promise<TestExplorerItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - EXPLORER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

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

        response = await currentsRequest<TestsExplorerResponse>(
            `/tests/${projectId}?${queryString}`,
        );

        items.push(...response.data.list);
        page++;
    } while (response.data.nextPage);

    return items;
}

/**
 * Fetch all auto-quarantine actions for a project.
 */
export async function getAutoQuarantineActions(projectId: string): Promise<Action[]> {
    const response = await currentsRequest<ActionsListResponse>(`/actions?projectId=${projectId}`);

    return response.data.filter(
        a => a.name.startsWith(AUTO_QUARANTINE_PREFIX) && a.action.some(r => r.op === 'quarantine'),
    );
}

/**
 * Fetch ALL quarantine actions for a project (both manual and auto-quarantined).
 */
export async function getAllQuarantineActions(projectId: string): Promise<Action[]> {
    const response = await currentsRequest<ActionsListResponse>(`/actions?projectId=${projectId}`);

    return response.data.filter(a => a.action.some(r => r.op === 'quarantine'));
}

/**
 * Create a quarantine action for a failing test.
 */
export function createQuarantineAction(
    projectId: string,
    test: TestExplorerItem,
    stats: ReturnType<typeof computeStats>,
): Promise<Action> {
    const failurePercent = Math.round(stats.failureRate * 100);
    const name = `${AUTO_QUARANTINE_PREFIX} ${test.title.slice(0, 80)}`;

    // Use the normalised titlePath (individual spec / describe / test-name parts)
    // rather than the raw title, which Currents often returns as a single ' > '-joined string.
    const titlePath = normalizeTitlePath(test);

    const description =
        `Automatically quarantined by test-health-check workflow.\n` +
        `Reason: ${failurePercent}% failure rate (${stats.failures}/${stats.executions} latest executions).\n` +
        `Spec: ${test.spec}\n` +
        `Full title path: ${titlePath.join(' > ')}`;

    const body = {
        name,
        description,
        action: [{ op: 'quarantine' }],
        matcher: {
            op: 'AND',
            cond: [{ type: 'titlePath', op: 'incAll', value: titlePath }],
        },
    };

    return currentsRequest<Action>(`/actions?projectId=${projectId}`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * Delete (remove) a quarantine action.
 */
export async function deleteAction(actionId: string): Promise<void> {
    await currentsRequest(`/actions/${actionId}`, { method: 'DELETE' });
}
