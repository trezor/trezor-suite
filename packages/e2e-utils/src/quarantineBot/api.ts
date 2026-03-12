import { computeStats, normalizeTitlePath } from './actions';
import { AUTO_QUARANTINE_PREFIX, EXPLORER_LOOKBACK_DAYS } from './config';
import { createAction, currentsRequest, getActions } from '../currentsApi/api';
import type { Action, TestExplorerItem, TestsExplorerResponse } from '../currentsApi/types';

export async function getAutoQuarantineActions(projectId: string): Promise<Action[]> {
    const actions = await getActions(projectId);

    return actions.filter(
        a => a.name.startsWith(AUTO_QUARANTINE_PREFIX) && a.action.some(r => r.op === 'quarantine'),
    );
}

/**
 * Shared low-level helper that POSTs a quarantine action to Currents.
 * Callers are responsible for building the appropriate description string.
 */
function postQuarantineAction(
    projectId: string,
    titlePath: string[],
    description: string,
): Promise<Action> {
    const name = `${AUTO_QUARANTINE_PREFIX} ${titlePath.join(' > ').slice(0, 80)}`;

    return createAction(projectId, {
        name,
        description,
        action: [{ op: 'quarantine' }],
        matcher: {
            op: 'AND',
            cond: [{ type: 'titlePath', op: 'incAll', value: titlePath }],
        },
    });
}

/**
 * Create a quarantine action for a failing test discovered by the health-check workflow.
 */
export function createQuarantineAction(
    projectId: string,
    test: TestExplorerItem,
    stats: ReturnType<typeof computeStats>,
): Promise<Action> {
    const failurePercent = Math.round(stats.failureRate * 100);
    // Use the normalised titlePath (individual spec / describe / test-name parts)
    // rather than the raw title, which Currents often returns as a single ' > '-joined string.
    const titlePath = normalizeTitlePath(test);
    const description =
        `Automatically quarantined by test-health-check workflow.\n` +
        `Reason: ${failurePercent}% failure rate (${stats.failures}/${stats.executions} latest executions).\n` +
        `Spec: ${test.spec}\n` +
        `Full title path: ${titlePath.join(' > ')}`;

    return postQuarantineAction(projectId, titlePath, description);
}

/**
 * Create a quarantine action for a test identified by its titlePath.
 * Used for manually-triggered quarantines (e.g. from a specific run).
 */
export function createManualQuarantineAction(
    projectId: string,
    titlePath: string[],
    spec: string,
    runId: string,
): Promise<Action> {
    const description =
        `Automatically quarantined from Currents run ${runId}.\n` +
        `Spec: ${spec}\n` +
        `Full title path: ${titlePath.join(' > ')}`;

    return postQuarantineAction(projectId, titlePath, description);
}

/**
 * Page through the Tests Explorer until signatures are found for every
 * title key in `titleKeys`, or all pages are exhausted.
 * Returns a map of titleKey → signature for every key that was located.
 */
export async function findSignaturesForTitleKeys(
    projectId: string,
    titleKeys: Set<string>,
): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - EXPLORER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const toDateString = (d: Date) => d.toISOString().slice(0, 10);
    const limit = 25;
    let page = 0;
    let nextPage = true;

    while (nextPage && found.size < titleKeys.size) {
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

        for (const item of response.data.list) {
            const key = JSON.stringify(normalizeTitlePath(item));
            if (titleKeys.has(key) && item.signature) {
                found.set(key, item.signature);
            }
        }

        nextPage = response.data.nextPage;
        page++;
    }

    return found;
}
