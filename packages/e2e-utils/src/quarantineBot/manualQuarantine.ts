import * as readline from 'readline';

import { extractKeyFromAction } from './actions';
import { createManualQuarantineAction } from './api';
import { PROJECTS } from './config';
import { debug, log } from '../logger';
import type { FailedTestFromRun, SlackEvent } from './types';
import { getAllQuarantineActions, getRunById } from '../currentsApi/api';
import { SpecFetchMode } from '../currentsApi/types';

function promptUser(question: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    return new Promise(resolve => {
        rl.question(`${question} [y/N] `, answer => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Quarantine all (or interactively selected) failed tests from a specific Currents run.
 *
 * @param runId      - The Currents run ID to inspect.
 * @param interactive - When true, prompt the user before quarantining each test.
 * @param slackEvents - Accumulator for Slack notification events.
 * @returns The project ID and label associated with the run.
 */
export async function quarantineFromRun(
    runId: string,
    interactive: boolean,
    slackEvents: SlackEvent[],
): Promise<{ projectId: string; projectLabel: string }> {
    log(`\n=== Manual Quarantine from Run ${runId} ===`);
    log(`Timestamp: ${new Date().toISOString()}`);

    // Fetch run — only populate specs that had at least one failure.
    log('\nFetching run data...');
    const run = await getRunById(runId, SpecFetchMode.FailuresOnly);
    const { projectId } = run;

    const project = PROJECTS.find(p => p.id === projectId);
    const projectLabel = project?.label ?? projectId;

    log(`Project: ${projectLabel} (${projectId})`);
    debug(
        `run ${runId}: ${run.specs.length} total spec(s),`,
        `${run.specs.filter(s => (s.results?.stats?.failures ?? 0) > 0).length} with failure(s)`,
        `(SpecFetchMode.FailuresOnly — only those were fetched in detail)`,
    );

    // Collect failed tests from all specs in the run
    const failedTests: FailedTestFromRun[] = [];
    for (const spec of run.specs) {
        if (!spec.results?.tests) {
            continue;
        }
        for (const test of spec.results.tests) {
            if (test.state === 'failed') {
                failedTests.push({ titlePath: test.title, spec: spec.spec });
            }
        }
    }

    if (failedTests.length === 0) {
        log('\n  ✓ No failed tests found in this run.');

        return { projectId, projectLabel };
    }

    log(`\nFound ${failedTests.length} failed test(s).`);

    // Fetch existing quarantine actions so we can skip already-quarantined tests.
    // We also track keys we quarantine during this run to avoid creating duplicates
    // if the same test failed in multiple specs within the same run.
    const existingActions = await getAllQuarantineActions(projectId);
    const existingTitleKeys = new Set(
        existingActions.map(a => extractKeyFromAction(a)).filter(Boolean),
    );
    debug(`existing quarantine actions for project: ${existingActions.length}`);

    let quarantinedCount = 0;
    let skippedCount = 0;

    for (const test of failedTests) {
        // Normalize the title path the same way auto-quarantine does so the key
        // comparison works consistently against both auto- and manual-quarantine
        // actions that may store titles as concatenated ' > ' strings.
        const normalizedTitlePath = test.titlePath.flatMap(part => part.split(' > '));
        const titleKey = JSON.stringify(normalizedTitlePath);
        const testTitle = normalizedTitlePath.join(' > ');

        if (existingTitleKeys.has(titleKey)) {
            log(`  ↳ Already quarantined: "${testTitle.slice(0, 80)}"`);
            skippedCount++;
            continue;
        }

        if (interactive) {
            log(`\n  Test: "${testTitle.slice(0, 100)}"`);
            log(`  Spec: ${test.spec}`);
            const confirmed = await promptUser('  Quarantine this test?');
            if (!confirmed) {
                log('  ↳ Skipped.');
                skippedCount++;
                continue;
            }
        } else {
            log(`  ↳ Quarantining: "${testTitle.slice(0, 80)}"`);
        }
        debug(`  spec: ${test.spec}`);

        const action = await createManualQuarantineAction(
            projectId,
            normalizedTitlePath,
            test.spec,
            runId,
        );
        debug(`  created action: actionId=${action.actionId}`);
        quarantinedCount++;
        // Track the key so a duplicate failure of the same test within this run
        // is not quarantined a second time.
        existingTitleKeys.add(titleKey);

        slackEvents.push({
            kind: 'quarantined',
            projectId,
            titlePath: normalizedTitlePath,
            // No cross-run signature available for manually-triggered quarantines.
            signature: undefined,
            actionId: action.actionId,
            failures: 1,
            executions: 1,
        });
    }

    log(`\n  Summary: ${quarantinedCount} quarantined, ${skippedCount} skipped.`);

    return { projectId, projectLabel };
}
