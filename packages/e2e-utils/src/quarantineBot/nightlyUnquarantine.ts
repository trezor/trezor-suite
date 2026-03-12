/* eslint-disable no-console */
import { extractKeyFromAction } from './actions';
import { findSignaturesForTitleKeys, getAutoQuarantineActions } from './api';
import { DEVELOP_BRANCH, EXPLORER_LOOKBACK_DAYS } from './config';
import type { SlackEvent } from './types';
import { deleteAction, getLatestRunIdOnBranch, getResultsFromRun } from '../currentsApi/api';

/**
 * Unquarantine auto-quarantined tests that passed in the latest run on the
 * default (develop) branch.
 *
 * This is intended to be run nightly so that tests whose quarantine was
 * triggered automatically are restored as soon as they demonstrate they pass
 * on the main branch — without waiting for the broader statistical threshold
 * used by the regular health-check (`unquarantinePassingTests`).
 *
 * A test is only unquarantined if ALL its instances in the run passed (i.e.
 * every Playwright project that executed it reported a pass). This handles
 * multi-project runs where the same test title can appear more than once.
 *
 * To minimise API calls the function never loads the full run. Instead it:
 *   1. Fetches only the auto-quarantined actions (one API call).
 *   2. Pages through the Tests Explorer only until signatures are found for
 *      every quarantined test (early-exit pagination).
 *   3. Resolves the latest develop runId with a single metadata call.
 *   4. For each quarantined test individually fetches only its own results
 *      filtered to that runId.
 */
export async function nightlyUnquarantineFromLatestRun(
    projectId: string,
    projectLabel: string,
    slackEvents: SlackEvent[],
): Promise<void> {
    console.log(
        `\n── [${projectLabel}] Nightly unquarantine from latest "${DEVELOP_BRANCH}" run ──`,
    );

    // Load the smaller set first: only the currently auto-quarantined tests.
    // This lets us bail early when there is nothing to do and avoids fetching
    // the full run just to find out there are no candidates.
    const existingActions = await getAutoQuarantineActions(projectId);
    if (existingActions.length === 0) {
        console.log('  ✓ No auto-quarantined tests to check.');

        return;
    }

    console.log(`  ${existingActions.length} auto-quarantined test(s) to evaluate.`);

    // Build titleKey → action map and collect the set of keys we need signatures for.
    const quarantinedByKey = new Map<string, (typeof existingActions)[number]>();
    const titleKeys = new Set<string>();
    for (const action of existingActions) {
        const key = extractKeyFromAction(action);
        if (key) {
            quarantinedByKey.set(key, action);
            titleKeys.add(key);
        } else {
            console.warn(`  ↳ Could not extract title from action "${action.name}", skipping.`);
        }
    }

    // Resolve the latest develop runId and each test's signature in parallel.
    // The explorer pagination stops as soon as signatures for all quarantined
    // tests are found, so it typically completes in very few requests.
    const [runId, signatureByKey] = await Promise.all([
        getLatestRunIdOnBranch(projectId, DEVELOP_BRANCH),
        findSignaturesForTitleKeys(projectId, titleKeys),
    ]);

    if (!runId) {
        console.log(`  No run found on branch "${DEVELOP_BRANCH}" for this project.`);

        return;
    }

    console.log(`  Found run: ${runId}`);

    // For each quarantined test, fetch only its own results filtered to the
    // latest run. One API call per test — no unrelated spec data is loaded.
    const instanceStats = new Map<string, { total: number; passed: number }>();
    await Promise.all(
        [...quarantinedByKey.keys()].map(async key => {
            const signature = signatureByKey.get(key);
            if (!signature) {
                return; // test not seen in the explorer lookback window — leave quarantined
            }
            const results = await getResultsFromRun(signature, runId, EXPLORER_LOOKBACK_DAYS);
            if (results.length === 0) {
                return;
            }
            instanceStats.set(key, {
                total: results.length,
                passed: results.filter(r => r.status === 'passed').length,
            });
        }),
    );

    let unquarantinedCount = 0;

    for (const [testKey, action] of quarantinedByKey) {
        const testTitle = (JSON.parse(testKey) as string[]).join(' > ');
        const stats = instanceStats.get(testKey);

        if (!stats || stats.total === 0) {
            console.log(`  ↳ Not seen in run: "${testTitle.slice(0, 80)}" — keeping quarantine.`);
            continue;
        }

        if (stats.passed < stats.total) {
            console.log(
                `  ↳ Not all instances passed (${stats.passed}/${stats.total}): "${testTitle.slice(0, 80)}" — keeping quarantine.`,
            );
            continue;
        }

        console.log(
            `  ↳ Unquarantining: "${testTitle.slice(0, 80)}" (${stats.total} instance(s) all passed) ✓`,
        );
        await deleteAction(action.actionId);
        unquarantinedCount++;

        slackEvents.push({
            kind: 'unquarantined',
            projectId,
            titlePath: JSON.parse(testKey) as string[],
            signature: undefined,
            passes: stats.passed,
            executions: stats.total,
        });
    }

    if (unquarantinedCount === 0) {
        console.log('  ✓ No quarantined tests found passing in all instances of the latest run.');
    }
}
