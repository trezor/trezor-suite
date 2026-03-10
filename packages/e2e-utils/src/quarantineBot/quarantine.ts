/* eslint-disable no-console */
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
import type { Action, SlackEvent, TestExplorerItem } from './types';
import { deleteAction, getLastNResults, getLastNResultsFromDistinctBranches } from '../currentsApi/api';

export async function quarantineFailingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
    slackEvents: SlackEvent[],
): Promise<void> {
    console.log(`\n── [${projectLabel}] Checking for failing tests to quarantine ──`);

    const alreadyQuarantinedKeys = new Set(
        existingActions.map(a => extractKeyFromAction(a)).filter(Boolean) as string[],
    );

    const candidateTests = activeTests.filter(
        t =>
            t.signature &&
            t.metrics.executions >= QUARANTINE_LAST_N_EXECUTIONS &&
            t.metrics.failureRate >= PRE_FILTER_FAILURE_RATE,
    );

    console.log(
        `  Found ${activeTests.length} active test(s) in the last ${EXPLORER_LOOKBACK_DAYS} days. ` +
            `${candidateTests.length} candidate(s) have ≥${Math.round(PRE_FILTER_FAILURE_RATE * 100)}% failure rate in the explorer window. ` +
            `Fetching last ${QUARANTINE_LAST_N_EXECUTIONS} individual results for each candidate...`,
    );

    for (const test of candidateTests) {
        if (!test.signature) {
            continue;
        }

        if (alreadyQuarantinedKeys.has(getTestKey(test))) {
            console.log(`  ↳ Already quarantined: "${test.title.slice(0, 80)}"`);
            continue;
        }

        const results = await getLastNResultsFromDistinctBranches(test.signature, QUARANTINE_LAST_N_EXECUTIONS, EXPLORER_LOOKBACK_DAYS);

        if (results.length < QUARANTINE_LAST_N_EXECUTIONS) {
            console.log(
                `  ↳ Skipping "${test.title.slice(0, 80)}" — only ${results.length}/${QUARANTINE_LAST_N_EXECUTIONS} executions found.`,
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

        const action = await createQuarantineAction(projectId, test, stats);
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
        console.log('  ✓ No new tests to quarantine.');
    }
}

export async function unquarantinePassingTests(
    projectId: string,
    projectLabel: string,
    existingActions: Action[],
    activeTests: TestExplorerItem[],
    slackEvents: SlackEvent[],
): Promise<void> {
    console.log(`\n── [${projectLabel}] Checking quarantined tests for recovery ──`);

    if (existingActions.length === 0) {
        console.log('  ✓ No auto-quarantined tests to check.');

        return;
    }

    console.log(`  Found ${existingActions.length} auto-quarantined test(s).`);

    const testsByKey = new Map(activeTests.map(t => [getTestKey(t), t]));

    for (const action of existingActions) {
        const testKey = extractKeyFromAction(action);
        if (!testKey) {
            console.warn(`  ↳ Could not extract title from action "${action.name}", skipping.`);
            continue;
        }

        // Human-readable label for logs/Slack: the key is always JSON.stringify of the titlePath array.
        const testTitle = (JSON.parse(testKey) as string[]).join(' > ');

        // Look up the test signature from the pre-fetched explorer results.
        const test = testsByKey.get(testKey);

        if (!test?.signature) {
            console.log(
                `  ↳ "${testTitle.slice(0, 80)}" — not found in explorer (may not have run recently), keeping quarantine.`,
            );
            continue;
        }

        const results = await getLastNResults(test.signature, UNQUARANTINE_LAST_N_EXECUTIONS, EXPLORER_LOOKBACK_DAYS);

        if (results.length < UNQUARANTINE_LAST_N_EXECUTIONS) {
            console.log(
                `  ↳ "${testTitle.slice(0, 80)}" — only ${results.length}/${UNQUARANTINE_LAST_N_EXECUTIONS} executions found, keeping quarantine.`,
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
            slackEvents.push({
                kind: 'unquarantined',
                projectId,

                titlePath: JSON.parse(testKey) as string[],
                signature: test.signature,
                passes: stats.passes,
                executions: stats.executions,
            });
        } else {
            console.log(
                `  ↳ Still failing: "${testTitle.slice(0, 80)}" ` +
                    `(${failurePercent}% failure rate, ${stats.failures}/${stats.executions} latest runs) — keeping quarantine.`,
            );
        }
    }
}
