/* eslint-disable no-console */
/**
 * Currents.dev Test Health Check
 *
 * Periodically:
 * 1. Enumerates recently-active tests via the Tests Explorer, then fetches the latest
 *    LAST_N_EXECUTIONS individual results per test via the Test Results API and quarantines
 *    any test with ≥60% failure rate in that window.
 * 2. For already-quarantined tests, checks their latest LAST_N_EXECUTIONS results and
 *    unquarantines any that now have 0% failure rate.
 *
 * Projects monitored:
 *   Web E2E: Og0NOQ
 *   Desktop E2E: 4ytF0E
 */

const CURRENTS_API_BASE = 'https://api.currents.dev/v1';
const AUTO_QUARANTINE_PREFIX = '[auto-quarantine]';

/**
 * Heuristic thresholds
 */
const QUARANTINE_FAILURE_RATE = 0.6; // quarantine if ≥60% fails in the last N executions
const UNQUARANTINE_FAILURE_RATE = 0; // unquarantine if test becomes perfectly stable (0% failures in the last N executions)
const LAST_N_EXECUTIONS = 5; // number of individual executions to evaluate
const EXPLORER_LOOKBACK_DAYS = 1; // window used by Tests Explorer to discover active tests
// Pre-filter: skip only tests that are nearly perfect (>98% pass rate) in the explorer window.
// Any test with ≥2% failure rate in the aggregate metrics is worth inspecting individually.
// The exact quarantine decision is still made on the precise last-N execution results.
const PRE_FILTER_RATE = 0.02; // inspect anything that isn't close to 100% passing

const PROJECTS: Array<{ id: string; label: string }> = [
    { id: 'Og0NOQ', label: 'Trezor Suite (web)' },
    { id: '4ytF0E', label: 'Trezor Suite (desktop)' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestExplorerMetrics {
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

interface TestExplorerItem {
    title: string;
    titlePath?: string[];
    spec: string;
    signature?: string;
    latestTag?: string[];
    lastSeen?: string;
    metrics: TestExplorerMetrics;
}

interface TestsExplorerResponse {
    status: string;
    data: {
        list: TestExplorerItem[];
        count: number;
        total: number;
        nextPage: boolean;
    };
}

interface RuleMatcherCondition {
    type: string;
    op: string;
    value: string | string[];
}

interface RuleMatcher {
    op: string;
    cond: RuleMatcherCondition[];
}

interface RuleAction {
    op: 'skip' | 'quarantine' | 'tag';
    details?: { tags: string[] };
}

interface Action {
    actionId: string;
    name: string;
    description: string;
    action: RuleAction[];
    matcher: RuleMatcher;
    status: string;
    createdAt: string;
    expiresAfter?: string;
}

interface ActionsListResponse {
    status: string;
    data: Action[];
}

interface TestResultCommit {
    branch: string;
    sha: string;
    authorName: string;
    authorEmail: string;
    message: string;
}

interface TestResultItem {
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

interface TestResultsResponse {
    status: string;
    has_more: boolean;
    data: TestResultItem[];
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
    const key = process.env.CURRENTS_API_KEY;
    if (!key) throw new Error('CURRENTS_API_KEY env var is not set');

    return key;
}

function getSlackWebhook(): string | undefined {
    return process.env.E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK;
}

async function currentsRequest<T>(
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
 * Fetch the latest N individual execution results for a specific test signature
 * via the Test Results API. Results are returned newest-first.
 */
async function getLastNResults(
    signature: string,
    n = LAST_N_EXECUTIONS,
): Promise<TestResultItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - EXPLORER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const queryString = [
        `date_start=${dateStart.toISOString()}`,
        `date_end=${dateEnd.toISOString()}`,
        `limit=${n}`,
    ].join('&');

    const response = await currentsRequest<TestResultsResponse>(
        `/test-results/${signature}?${queryString}`,
    );

    return response.data;
}

/**
 * Compute failure stats from a list of individual execution results.
 */
function computeStats(results: TestResultItem[]): {
    executions: number;
    failures: number;
    passes: number;
    failureRate: number;
} {
    const executions = results.length;
    const failures = results.filter(r => r.status === 'failed').length;
    const passes = results.filter(r => r.status === 'passed').length;
    const failureRate = executions > 0 ? failures / executions : 0;

    return { executions, failures, passes, failureRate };
}

/**
 * Fetch all pages from the Tests Explorer for a given project.
 * Used only to enumerate active tests and obtain their signatures.
 */
async function getActiveTests(projectId: string): Promise<TestExplorerItem[]> {
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - EXPLORER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    // The Currents API only accepts date-only strings (YYYY-MM-DD); time components are ignored/rejected
    const toDateString = (d: Date) => d.toISOString().slice(0, 10);

    const items: TestExplorerItem[] = [];
    let page = 0;
    const limit = 25;

    while (true) {
        const queryString = [
            `date_start=${toDateString(dateStart)}`,
            `date_end=${toDateString(dateEnd)}`,
            `order=failRateXSamples`,
            `dir=desc`,
            `page=${page}`,
            `limit=${limit}`,
        ].join('&');

        const response = await currentsRequest<TestsExplorerResponse>(
            `/tests/${projectId}?${queryString}`,
        );

        items.push(...response.data.list);

        if (!response.data.nextPage) break;
        page++;
    }

    return items;
}

/**
 * Fetch all auto-quarantine actions for a project.
 */
async function getAutoQuarantineActions(projectId: string): Promise<Action[]> {
    const response = await currentsRequest<ActionsListResponse>(`/actions?projectId=${projectId}`);

    return response.data.filter(
        a => a.name.startsWith(AUTO_QUARANTINE_PREFIX) && a.action.some(r => r.op === 'quarantine'),
    );
}

/**
 * Extract the test title from an action's matcher conditions.
 */
function extractTitleFromAction(action: Action): string | undefined {
    const conds = action.matcher?.cond ?? [];
    const titleCond = conds.find(c => c.type === 'title' && c.op === 'eq');

    return typeof titleCond?.value === 'string' ? titleCond.value : undefined;
}

/**
 * Create a quarantine action for a failing test.
 */
function createQuarantineAction(
    projectId: string,
    test: TestExplorerItem,
    stats: ReturnType<typeof computeStats>,
): Promise<Action> {
    const failurePercent = Math.round(stats.failureRate * 100);
    const name = `${AUTO_QUARANTINE_PREFIX} ${test.title.slice(0, 80)}`;
    const description =
        `Automatically quarantined by test-health-check workflow.\n` +
        `Reason: ${failurePercent}% failure rate (${stats.failures}/${stats.executions} latest executions).\n` +
        `Spec: ${test.spec}\n` +
        `Full title: ${test.title}`;

    const body = {
        name,
        description,
        action: [{ op: 'quarantine' }],
        matcher: {
            op: 'AND',
            cond: [{ type: 'title', op: 'eq', value: test.title }],
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
async function deleteAction(actionId: string): Promise<void> {
    await currentsRequest(`/actions/${actionId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Slack notification
// ---------------------------------------------------------------------------

async function sendSlackNotification(message: string): Promise<void> {
    const webhook = getSlackWebhook();
    if (!webhook) {
        console.log(
            '[slack] No E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK configured, skipping notification.',
        );
        console.log(`[slack] Message would have been:\n${message}`);

        return;
    }
    const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
        console.warn(`[slack] Failed to send Slack notification: ${res.status}`);
    }
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

async function quarantineFailingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
): Promise<void> {
    console.log(`\n── [${projectLabel}] Checking for failing tests to quarantine ──`);

    const alreadyQuarantinedTitles = new Set(
        existingActions.map(a => extractTitleFromAction(a)).filter(Boolean) as string[],
    );

    const candidateTests = activeTests.filter(
        t =>
            t.signature &&
            t.metrics.executions >= LAST_N_EXECUTIONS &&
            t.metrics.failureRate >= PRE_FILTER_RATE,
    );

    console.log(
        `  Found ${activeTests.length} active test(s) in the last ${EXPLORER_LOOKBACK_DAYS} days. ` +
            `${candidateTests.length} candidate(s) have ≥${Math.round(PRE_FILTER_RATE * 100)}% failure rate in the explorer window. ` +
            `Fetching last ${LAST_N_EXECUTIONS} individual results for each candidate...`,
    );

    let newQuarantineCount = 0;

    for (const test of candidateTests) {
        if (!test.signature) {
            continue;
        }

        if (alreadyQuarantinedTitles.has(test.title)) {
            console.log(`  ↳ Already quarantined: "${test.title.slice(0, 80)}"`);
            continue;
        }

        const results = await getLastNResults(test.signature);

        if (results.length < LAST_N_EXECUTIONS) {
            console.log(
                `  ↳ Skipping "${test.title.slice(0, 80)}" — only ${results.length}/${LAST_N_EXECUTIONS} executions found.`,
            );
            continue;
        }

        const stats = computeStats(results);

        if (stats.failureRate < QUARANTINE_FAILURE_RATE) {
            continue;
        }

        const failurePercent = Math.round(stats.failureRate * 100);
        console.log(
            `  ↳ Quarantining: "${test.title.slice(0, 80)}" ` +
                `(${failurePercent}% fail rate, ${stats.failures}/${stats.executions} latest runs)`,
        );

        await createQuarantineAction(projectId, test, stats);
        newQuarantineCount++;

        const slackMsg =
            `:warning: *[${projectLabel}] Test auto-quarantined* :warning:\n` +
            `> *Test:* \`${test.title}\`\n` +
            `> *Spec:* \`${test.spec}\`\n` +
            `> *Failure rate:* ${failurePercent}% (${stats.failures}/${stats.executions} latest executions)\n` +
            `> *Action:* Test has been quarantined in Currents — its failures will no longer block CI.\n` +
            `> _Investigate and fix the issue, then the test will be automatically unquarantined once it stabilises._\n` +
            `> <https://app.currents.dev/projects/${projectId}|View in Currents Dashboard>`;

        await sendSlackNotification(slackMsg);
    }

    if (newQuarantineCount === 0) {
        console.log('  ✓ No new tests to quarantine.');
    }
}

async function unquarantinePassingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
): Promise<void> {
    console.log(`\n── [${projectLabel}] Checking quarantined tests for recovery ──`);

    if (existingActions.length === 0) {
        console.log('  ✓ No auto-quarantined tests to check.');

        return;
    }

    console.log(`  Found ${existingActions.length} auto-quarantined test(s).`);

    const testsByTitle = new Map(activeTests.map(t => [t.title, t]));

    for (const action of existingActions) {
        const testTitle = extractTitleFromAction(action);
        if (!testTitle) {
            console.warn(`  ↳ Could not extract title from action "${action.name}", skipping.`);
            continue;
        }

        // Look up the test signature from the pre-fetched explorer results.
        const test = testsByTitle.get(testTitle);

        if (!test?.signature) {
            console.log(
                `  ↳ "${testTitle.slice(0, 80)}" — not found in explorer (may not have run recently), keeping quarantine.`,
            );
            continue;
        }

        const results = await getLastNResults(test.signature);

        if (results.length < LAST_N_EXECUTIONS) {
            console.log(
                `  ↳ "${testTitle.slice(0, 80)}" — only ${results.length}/${LAST_N_EXECUTIONS} executions found, keeping quarantine.`,
            );
            continue;
        }

        const stats = computeStats(results);
        const failurePercent = Math.round(stats.failureRate * 100);
        const passPercent = 100 - failurePercent;

        if (stats.failureRate <= UNQUARANTINE_FAILURE_RATE) {
            console.log(
                `  ↳ Unquarantining: "${testTitle.slice(0, 80)}" ` +
                    `(${passPercent}% pass rate, ${stats.passes}/${stats.executions} latest runs) ✓`,
            );

            await deleteAction(action.actionId);

            const slackMsg =
                `:white_check_mark: *[${projectLabel}] Quarantined test is now healthy* :white_check_mark:\n` +
                `> *Test:* \`${testTitle}\`\n` +
                `> *Spec:* \`${test.spec}\`\n` +
                `> *Pass rate:* ${passPercent}% (${stats.passes}/${stats.executions} latest executions)\n` +
                `> *Action:* Test has been removed from quarantine — it will now contribute to CI results as normal.\n` +
                `> <https://app.currents.dev/projects/${projectId}|View in Currents Dashboard>`;

            await sendSlackNotification(slackMsg);
        } else {
            console.log(
                `  ↳ Still failing: "${testTitle.slice(0, 80)}" ` +
                    `(${failurePercent}% failure rate, ${stats.failures}/${stats.executions} latest runs) — keeping quarantine.`,
            );
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    console.log('=== Currents Test Health Check ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    console.log(
        `Thresholds: quarantine ≥${QUARANTINE_FAILURE_RATE * 100}% failures, unquarantine ≤${UNQUARANTINE_FAILURE_RATE * 100}% failures, ` +
            `evaluated over last ${LAST_N_EXECUTIONS} individual executions (using Test Results API)`,
    );
    console.log('');

    let hasError = false;

    for (const project of PROJECTS) {
        try {
            const [existingActions, activeTests] = await Promise.all([
                getAutoQuarantineActions(project.id),
                getActiveTests(project.id),
            ]);
            await quarantineFailingTests(project.id, project.label, existingActions, activeTests);
            await unquarantinePassingTests(project.id, project.label, existingActions, activeTests);
        } catch (err) {
            console.error(
                `\n[ERROR] Failed processing project ${project.label} (${project.id}):`,
                err,
            );
            hasError = true;
        }
    }

    console.log('\n=== Done ===');

    if (hasError) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('[FATAL]', err);
    process.exit(1);
});
