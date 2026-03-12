import type { Action, TestExplorerItem, TestResultItem } from '../currentsApi/types';

/**
 * Normalise a test's title path into individual parts.
 *
 * The Currents explorer returns `titlePath` as an array when populated, but
 * often omits it entirely and instead concatenates all parts (spec, describe
 * blocks, test name) into the bare `title` field separated by ' > '.
 * Splitting on that separator gives the same individual strings that the UI
 * produces when you enter path parts manually.
 */
export function normalizeTitlePath(test: TestExplorerItem): string[] {
    const raw = test.titlePath && test.titlePath.length > 0 ? test.titlePath : [test.title];

    return raw.flatMap(part => part.split(' > '));
}

/**
 * Stable lookup key for a test, used to key internal maps and sets.
 *
 * Uses JSON.stringify of the normalised titlePath array so the key is
 * unambiguous and consistent with what we store in the action matcher.
 */
export function getTestKey(test: TestExplorerItem): string {
    return JSON.stringify(normalizeTitlePath(test));
}

/**
 * Extract the lookup key from an action's matcher conditions.
 * Expects `type: 'titlePath'` with an array value → JSON.stringify of that array.
 */
export function extractKeyFromAction(action: Action): string | undefined {
    const conds = action.matcher?.cond ?? [];
    const titlePathCond = conds.find(
        c =>
            c.type === 'titlePath' &&
            (c.op === 'incAll' || c.op === 'eq') &&
            Array.isArray(c.value),
    );

    return titlePathCond ? JSON.stringify(titlePathCond.value) : undefined;
}

/**
 * Compute failure stats from a list of individual execution results.
 */
export function computeStats(results: TestResultItem[]): {
    executions: number;
    failures: number;
    passes: number;
    failureRate: number;
} {
    const executions = results.length;
    const failures = results.filter(r => r.status === 'failed' || r.status === 'skipped').length;
    const passes = results.filter(r => r.status === 'passed').length;
    const failureRate = executions > 0 ? failures / executions : 0;

    return { executions, failures, passes, failureRate };
}
