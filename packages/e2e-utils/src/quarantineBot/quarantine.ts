import { computeStats, extractKeyFromAction, getTestKey, normalizeTitlePath } from './actions';
import { createQuarantineAction } from './api';
import {
    EXPLORER_LOOKBACK_DAYS,
    PRE_FILTER_FAILURE_RATE,
    QUARANTINE_FAILURE_RATE,
    QUARANTINE_LAST_N_EXECUTIONS,
    UNQUARANTINE_FAILURE_RATE,
    UNQUARANTINE_LAST_N_EXECUTIONS,
} from './config';
import { debug, log, warn } from '../logger';
import type { SlackEvent } from './types';
import {
    deleteAction,
    getLastNResults,
    getLastNResultsFromDistinctBranches,
} from '../currentsApi/api';
import type { Action, TestExplorerItem } from '../currentsApi/types';

export async function quarantineFailingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
    slackEvents: SlackEvent[],
): Promise<void> {
    log(`\n── [${projectLabel}] Checking for failing tests to quarantine ──`);

    const alreadyQuarantinedKeys = new Set(
        existingActions.map(a => extractKeyFromAction(a)).filter(Boolean) as string[],
    );
    debug(`  already quarantined keys: ${alreadyQuarantinedKeys.size}`);

    const candidateTests = activeTests.filter(
        t =>
            t.signature &&
            t.metrics.executions >= QUARANTINE_LAST_N_EXECUTIONS &&
            t.metrics.failureRate >= PRE_FILTER_FAILURE_RATE,
    );
    debug(
        `  pre-filter: ${activeTests.length} active test(s) total,`,
        `${activeTests.length - candidateTests.length} filtered out (no signature / <${QUARANTINE_LAST_N_EXECUTIONS} executions / <${Math.round(PRE_FILTER_FAILURE_RATE * 100)}% failure rate),`,
        `${candidateTests.length} candidate(s) remain`,
    );

    log(
        `  Found ${activeTests.length} active test(s) in the last ${EXPLORER_LOOKBACK_DAYS} days. ` +
            `${candidateTests.length} candidate(s) have ≥${Math.round(PRE_FILTER_FAILURE_RATE * 100)}% failure rate in the explorer window. ` +
            `Fetching last ${QUARANTINE_LAST_N_EXECUTIONS} individual results for each candidate...`,
    );

    for (const test of candidateTests) {
        if (!test.signature) {
            continue;
        }

        if (alreadyQuarantinedKeys.has(getTestKey(test))) {
            log(`  ↳ Already quarantined: "${test.title.slice(0, 80)}"`);
            continue;
        }

        const results = await getLastNResultsFromDistinctBranches(
            test.signature,
            QUARANTINE_LAST_N_EXECUTIONS,
            EXPLORER_LOOKBACK_DAYS,
        );

        if (results.length < QUARANTINE_LAST_N_EXECUTIONS) {
            log(
                `  ↳ Skipping "${test.title.slice(0, 80)}" — only ${results.length}/${QUARANTINE_LAST_N_EXECUTIONS} executions found.`,
            );
            continue;
        }

        const stats = computeStats(results);
        debug(
            `  candidate "${test.title.slice(0, 80)}":`,
            `failureRate=${Math.round(stats.failureRate * 100)}%,`,
            `failures=${stats.failures}, passes=${stats.passes}, executions=${stats.executions}`,
            `(threshold: ≥${Math.round(QUARANTINE_FAILURE_RATE * 100)}%)`,
        );

        if (stats.failureRate < QUARANTINE_FAILURE_RATE) {
            continue;
        }

        const failurePercent = Math.round(stats.failureRate * 100);
        log(
            `  ↳ Quarantining: "${test.title.slice(0, 80)}" ` +
                `(${failurePercent}% fail rate, ${stats.failures}/${stats.executions} latest runs)`,
        );

        const action = await createQuarantineAction(projectId, test, stats);
        debug(`  created action: actionId=${action.actionId}`);
        slackEvents.push({
            kind: 'quarantined',
            projectId,

            titlePath: normalizeTitlePath(test),
            signature: test.signature,
            actionId: action.actionId,
            failures: stats.failures,
            executions: stats.executions,
        });
    }

    const quarantinedCount = slackEvents.filter(e => e.kind === 'quarantined').length;
    if (quarantinedCount === 0) {
        log('  ✓ No new tests to quarantine.');
    }
}

export async function unquarantinePassingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
    slackEvents: SlackEvent[],
): Promise<void> {
    log(`\n── [${projectLabel}] Checking quarantined tests for recovery ──`);

    if (existingActions.length === 0) {
        log('  ✓ No auto-quarantined tests to check.');

        return;
    }

    log(`  Found ${existingActions.length} auto-quarantined test(s).`);

    const testsByKey = new Map(activeTests.map(t => [getTestKey(t), t]));
    debug(`  active tests index: ${testsByKey.size} entries`);

    for (const action of existingActions) {
        const testKey = extractKeyFromAction(action);
        if (!testKey) {
            warn(`  ↳ Could not extract title from action "${action.name}", skipping.`);
            continue;
        }

        // Human-readable label for logs/Slack: the key is always JSON.stringify of the titlePath array.
        const testTitle = (JSON.parse(testKey) as string[]).join(' > ');

        // Look up the test signature from the pre-fetched explorer results.
        const test = testsByKey.get(testKey);

        if (!test?.signature) {
            log(
                `  ↳ "${testTitle.slice(0, 80)}" — not found in explorer (may not have run recently), keeping quarantine.`,
            );
            continue;
        }

        const results = await getLastNResults(
            test.signature,
            UNQUARANTINE_LAST_N_EXECUTIONS,
            EXPLORER_LOOKBACK_DAYS,
        );

        if (results.length < UNQUARANTINE_LAST_N_EXECUTIONS) {
            log(
                `  ↳ "${testTitle.slice(0, 80)}" — only ${results.length}/${UNQUARANTINE_LAST_N_EXECUTIONS} executions found, keeping quarantine.`,
            );
            continue;
        }

        const stats = computeStats(results);
        const failurePercent = Math.round(stats.failureRate * 100);
        const passPercent = 100 - failurePercent;
        debug(
            `  quarantined "${testTitle.slice(0, 80)}":`,
            `failureRate=${failurePercent}%,`,
            `failures=${stats.failures}, passes=${stats.passes}, executions=${stats.executions}`,
            `(unquarantine threshold: ≤${Math.round(UNQUARANTINE_FAILURE_RATE * 100)}%)`,
        );

        if (stats.failureRate <= UNQUARANTINE_FAILURE_RATE) {
            log(
                `  ↳ Unquarantining: "${testTitle.slice(0, 80)}" ` +
                    `(${passPercent}% pass rate, ${stats.passes}/${stats.executions} latest runs) ✓`,
            );

            await deleteAction(action.actionId);
            debug(`  deleted action: actionId=${action.actionId}`);
            slackEvents.push({
                kind: 'unquarantined',
                projectId,

                titlePath: JSON.parse(testKey) as string[],
                signature: test.signature,
                passes: stats.passes,
                executions: stats.executions,
            });
        } else {
            log(
                `  ↳ Still failing: "${testTitle.slice(0, 80)}" ` +
                    `(${failurePercent}% failure rate, ${stats.failures}/${stats.executions} latest runs) — keeping quarantine.`,
            );
        }
    }
}
