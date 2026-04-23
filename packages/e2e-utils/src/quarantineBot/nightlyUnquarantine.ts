import { extractKeyFromAction } from './actions';
import {
    findSignaturesForTitleKeys,
    getAutoQuarantineActions,
    narrowQuarantineToCanary,
} from './api';
import { DEVELOP_BRANCH, EXPLORER_LOOKBACK_DAYS, FW_CANARY_TAG } from './config';
import { deleteAction, getLatestRunIdOnBranch, getResultsFromRun } from '../currentsApi/api';
import { debug, log, warn } from '../logger';
import type { SlackEvent } from './types';
import type { TestResultItem } from '../currentsApi/types';

/**
 * Unquarantine auto-quarantined tests that passed in the latest run on the
 * default (develop) branch.
 *
 * This is intended to be run nightly so that tests whose quarantine was
 * triggered automatically are restored as soon as they demonstrate they pass
 * on the main branch — without waiting for the broader statistical threshold
 * used by the regular health-check (`unquarantinePassingTests`).
 *
 * When tag information is available in results, fw canary instances (tagged
 * `fwCanary`) are evaluated separately from regular instances:
 *  - Regular all pass + canary all pass (or no canary) → full unquarantine.
 *  - Regular all pass + some canary still fail → narrow the quarantine action
 *    to canary-only (tag: fwCanary), keeping the test visible in regular runs.
 *  - Any regular instance fails → keep quarantine unchanged.
 *
 * If the API does not return tag information (all tags undefined), the
 * function falls back to the original behaviour: all instances must pass.
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
    log(`\n── [${projectLabel}] Nightly unquarantine from latest "${DEVELOP_BRANCH}" run ──`);

    // Load the smaller set first: only the currently auto-quarantined tests.
    // This lets us bail early when there is nothing to do and avoids fetching
    // the full run just to find out there are no candidates.
    const existingActions = await getAutoQuarantineActions(projectId);
    if (existingActions.length === 0) {
        log('  ✓ No auto-quarantined tests to check.');

        return;
    }

    log(`  ${existingActions.length} auto-quarantined test(s) to evaluate.`);

    // Build titleKey → action map and collect the set of keys we need signatures for.
    const quarantinedByKey = new Map<string, (typeof existingActions)[number]>();
    const titleKeys = new Set<string>();
    for (const action of existingActions) {
        const key = extractKeyFromAction(action);
        if (key) {
            quarantinedByKey.set(key, action);
            titleKeys.add(key);
        } else {
            warn(`  ↳ Could not extract title from action "${action.name}", skipping.`);
        }
    }
    debug(`  resolving signatures for ${titleKeys.size} title key(s)`);

    // Resolve the latest develop runId and each test's signature in parallel.
    // The explorer pagination stops as soon as signatures for all quarantined
    // tests are found, so it typically completes in very few requests.
    const [runId, signatureByKey] = await Promise.all([
        getLatestRunIdOnBranch(projectId, DEVELOP_BRANCH),
        findSignaturesForTitleKeys(projectId, titleKeys),
    ]);

    debug(
        `  signatures resolved: ${signatureByKey.size}/${titleKeys.size}`,
        signatureByKey.size < titleKeys.size
            ? `(${titleKeys.size - signatureByKey.size} not found in explorer window)`
            : '',
    );

    if (!runId) {
        log(`  No run found on branch "${DEVELOP_BRANCH}" for this project.`);

        return;
    }

    log(`  Found run: ${runId}`);
    debug(`  fetching per-test results from run ${runId} for ${quarantinedByKey.size} test(s)`);

    // For each quarantined test, fetch only its own results filtered to the
    // latest run. One API call per test — no unrelated spec data is loaded.
    const resultsByKey = new Map<string, TestResultItem[]>();
    await Promise.all(
        [...quarantinedByKey.keys()].map(async key => {
            const signature = signatureByKey.get(key);
            if (!signature) {
                debug(`  no signature for key ${key} — leaving quarantined`);

                return;
            }
            const results = await getResultsFromRun(signature, runId, EXPLORER_LOOKBACK_DAYS);
            debug(
                `  key ${key.slice(0, 60)}: ${results.length} result(s) in run`,
                results.length > 0
                    ? `(${results.filter(r => r.status === 'passed').length} passed)`
                    : '',
            );
            if (results.length > 0) {
                resultsByKey.set(key, results);
            }
        }),
    );

    let unquarantinedCount = 0;
    let narrowedCount = 0;

    for (const [testKey, action] of quarantinedByKey) {
        const testTitle = (JSON.parse(testKey) as string[]).join(' > ');
        const results = resultsByKey.get(testKey);

        if (!results || results.length === 0) {
            log(`  ↳ Not seen in run: "${testTitle.slice(0, 80)}" — keeping quarantine.`);
            continue;
        }

        // When the API returns tag information, evaluate canary and regular
        // instances separately. Fall back to treating all results as regular
        // (original behaviour) when tags are not present in the response.
        const hasTagInfo = results.some(r => r.tags !== undefined);
        const canaryResults = hasTagInfo
            ? results.filter(r => r.tags?.includes(FW_CANARY_TAG))
            : [];
        const regularResults = hasTagInfo
            ? results.filter(r => !r.tags?.includes(FW_CANARY_TAG))
            : results;

        debug(
            `  key ${testKey.slice(0, 60)}: hasTagInfo=${hasTagInfo}`,
            `regular=${regularResults.length} canary=${canaryResults.length}`,
        );

        if (regularResults.length === 0) {
            // Only canary instances ran this test in the latest develop run.
            // Keep the quarantine — we need regular instances to pass first.
            log(
                `  ↳ Only canary instances in run: "${testTitle.slice(0, 80)}" — keeping quarantine.`,
            );
            continue;
        }

        const regularPassed = regularResults.filter(r => r.status === 'passed').length;

        if (regularPassed < regularResults.length) {
            log(
                `  ↳ Not all regular instances passed (${regularPassed}/${regularResults.length}): "${testTitle.slice(0, 80)}" — keeping quarantine.`,
            );
            continue;
        }

        // All regular instances passed. Now check canary.
        const canaryPassed = canaryResults.filter(r => r.status === 'passed').length;
        const canaryAllPassed = canaryResults.length === 0 || canaryPassed === canaryResults.length;
        const signature = signatureByKey.get(testKey);

        if (canaryAllPassed) {
            log(
                `  ↳ Unquarantining: "${testTitle.slice(0, 80)}" (${results.length} instance(s) all passed) ✓`,
            );
            await deleteAction(action.actionId);
            debug(`  deleted action: actionId=${action.actionId}`);
            unquarantinedCount++;

            slackEvents.push({
                kind: 'unquarantined',
                projectId,
                titlePath: JSON.parse(testKey) as string[],
                signature,
                passes: results.filter(r => r.status === 'passed').length,
                executions: results.length,
            });
        } else {
            // Regular passed but canary still failing. If the action is already
            // canary-scoped, there is nothing to update — just keep it.
            const alreadyCanaryScoped = action.matcher.cond.some(
                c =>
                    c.type === 'tag' &&
                    (c.value === FW_CANARY_TAG ||
                        (Array.isArray(c.value) && c.value.includes(FW_CANARY_TAG))),
            );

            if (alreadyCanaryScoped) {
                log(
                    `  ↳ Canary still failing (${canaryPassed}/${canaryResults.length}): "${testTitle.slice(0, 80)}" — keeping canary quarantine.`,
                );
                continue;
            }

            log(
                `  ↳ Narrowing to canary: "${testTitle.slice(0, 80)}" (regular ${regularPassed}/${regularResults.length} passed, canary ${canaryPassed}/${canaryResults.length} passed) ✓`,
            );
            const narrowedAction = await narrowQuarantineToCanary(projectId, action);
            debug(`  narrowed action: actionId=${narrowedAction.actionId}`);
            narrowedCount++;

            slackEvents.push({
                kind: 'narrowed',
                projectId,
                titlePath: JSON.parse(testKey) as string[],
                signature,
                actionId: narrowedAction.actionId,
                regularPasses: regularPassed,
                regularTotal: regularResults.length,
            });
        }
    }

    if (unquarantinedCount === 0 && narrowedCount === 0) {
        log('  ✓ No quarantined tests found passing in all instances of the latest run.');
    }
}
