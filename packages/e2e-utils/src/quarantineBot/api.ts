import { computeStats, normalizeTitlePath } from './actions';
import { AUTO_QUARANTINE_PREFIX } from './config';
import { createAction, getActions } from '../currentsApi/api';
import type { Action, TestExplorerItem } from '../currentsApi/types';

export async function getAutoQuarantineActions(projectId: string): Promise<Action[]> {
    const actions = await getActions(projectId);

    return actions.filter(
        a => a.name.startsWith(AUTO_QUARANTINE_PREFIX) && a.action.some(r => r.op === 'quarantine'),
    );
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
