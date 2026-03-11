/* eslint-disable no-console */
import { getAllQuarantineActions } from '@trezor/e2e-utils';
import type { Action, RuleMatcherCondition } from '@trezor/e2e-utils';

export type { Action };

export interface TestIdentity {
    testTitle: string;
    titlePath: string[];
}

/**
 * Build the titlePath array for a testcase, mirroring the format that the Currents Test Explorer
 * returns for JUnit-uploaded tests and that the quarantine bot stores in action conditions.
 *
 * When tests are uploaded to Currents via `currents convert --input-format=junit`, Currents
 * constructs the title as "<testsuite name> > <testcase name>".  The quarantine bot then splits
 * that on " > " (via normalizeTitlePath) to produce a two-element array that it stores as the
 * `titlePath` condition value.  We need to reproduce that same two-element array here so that
 * `incAll` / `eq` conditions created by the bot actually match.
 */
export const getTitlePath = (suiteName: string, tc: any): string[] => {
    const testName: string = tc.$?.name ?? '';

    return [suiteName, testName].filter(Boolean);
};

/**
 * Evaluate a single condition against the test identity.
 * Supports:
 *   - type "title"     — matches against the flat JUnit `name` string
 *   - type "titlePath" — matches against the reconstructed path array (joined with " > " for string ops)
 * Supported ops: "eq", "contains", "startsWith", "endsWith", "incAll" (titlePath only).
 *
 * Note: "incAll" is the op produced by the auto-quarantine bot and checks that every
 * element of the condition value array is present somewhere in the titlePath array.
 */
export const evaluateCondition = (cond: RuleMatcherCondition, identity: TestIdentity): boolean => {
    if (cond.type === 'title') {
        const values = Array.isArray(cond.value) ? cond.value : [cond.value];
        const { testTitle } = identity;

        switch (cond.op) {
            case 'eq':
                return values.some(v => v === testTitle);
            case 'contains':
                return values.some(v => testTitle.includes(v));
            case 'startsWith':
                return values.some(v => testTitle.startsWith(v));
            case 'endsWith':
                return values.some(v => testTitle.endsWith(v));
            default:
                return false;
        }
    }

    if (cond.type === 'titlePath') {
        const { titlePath } = identity;
        const titlePathStr = titlePath.join(' > ');
        const values = Array.isArray(cond.value) ? cond.value : [cond.value];

        switch (cond.op) {
            // incAll: every element in the condition value must be present in titlePath.
            // This is the op created by the auto-quarantine bot.
            case 'incAll':
                return values.every(v => titlePath.includes(v));
            case 'eq':
                if (Array.isArray(cond.value)) {
                    return (
                        cond.value.length === titlePath.length &&
                        cond.value.every((v, i) => v === titlePath[i])
                    );
                }

                return values.some(v => v === titlePathStr);
            case 'contains':
                return values.some(v => titlePathStr.includes(v));
            case 'startsWith':
                return values.some(v => titlePathStr.startsWith(v));
            case 'endsWith':
                return values.some(v => titlePathStr.endsWith(v));
            default:
                return false;
        }
    }

    return false;
};

/**
 * Check whether a test (identified by title and titlePath) matches the given action's matcher.
 */
export const matchesAction = (identity: TestIdentity, action: Action): boolean => {
    const { matcher } = action;
    const conds = matcher.cond;

    return matcher.op === 'AND'
        ? conds.every(c => evaluateCondition(c, identity))
        : conds.some(c => evaluateCondition(c, identity));
};

/**
 * Determine if a test is covered by any quarantined action.
 */
export const isQuarantined = (identity: TestIdentity, quarantinedActions: Action[]): boolean =>
    quarantinedActions.some(a => matchesAction(identity, a));

/**
 * Fetch quarantined actions from Currents for the configured project.
 * Returns an empty array and logs a warning if the required env vars are missing.
 */
export const fetchQuarantinedActions = async (): Promise<Action[]> => {
    const projectId = process.env.CURRENTS_PROJECT_ID;
    const apiKey = process.env.CURRENTS_API_KEY;

    if (!projectId || !apiKey) {
        console.warn(
            '[quarantine] Missing CURRENTS_PROJECT_ID or CURRENTS_API_KEY env vars — skipping quarantine processing.',
        );

        return [];
    }

    try {
        const quarantined = await getAllQuarantineActions(projectId);
        console.log(
            `[quarantine] Loaded ${quarantined.length} quarantine action(s) from Currents.`,
        );

        return quarantined;
    } catch (err) {
        console.warn('[quarantine] Failed to fetch actions from Currents:', err);

        return [];
    }
};
