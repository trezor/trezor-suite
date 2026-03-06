/* eslint-disable no-console */
import { getActiveTests, getAutoQuarantineActions } from './api';
import {
    PROJECTS,
    QUARANTINE_FAILURE_RATE,
    QUARANTINE_LAST_N_EXECUTIONS,
    UNQUARANTINE_FAILURE_RATE,
    UNQUARANTINE_LAST_N_EXECUTIONS,
} from './config';
import { quarantineFailingTests, unquarantinePassingTests } from './quarantine';
import { buildSlackSummary, sendSlackNotification } from './slack';
import type { SlackEvent } from './types';
import { wipeAllAutoQuarantineActions } from './wipe';

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.includes('--wipeAutoQuarantine')) {
        await wipeAllAutoQuarantineActions();

        return;
    }

    console.log('=== Currents Test Health Check ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    console.log(
        `Thresholds: quarantine ≥${QUARANTINE_FAILURE_RATE * 100}% failures over last ${QUARANTINE_LAST_N_EXECUTIONS} executions, ` +
            `unquarantine ≤${UNQUARANTINE_FAILURE_RATE * 100}% failures over last ${UNQUARANTINE_LAST_N_EXECUTIONS} executions (using Test Results API)`,
    );
    console.log('');

    let hasError = false;
    const slackEvents: SlackEvent[] = [];

    for (const project of PROJECTS) {
        try {
            const [existingActions, activeTests] = await Promise.all([
                getAutoQuarantineActions(project.id),
                getActiveTests(project.id),
            ]);
            await quarantineFailingTests(
                project.id,
                project.label,
                existingActions,
                activeTests,
                slackEvents,
            );
            await unquarantinePassingTests(
                project.id,
                project.label,
                existingActions,
                activeTests,
                slackEvents,
            );
        } catch (err) {
            console.error(
                `\n[ERROR] Failed processing project ${project.label} (${project.id}):`,
                err,
            );
            hasError = true;
        }
    }

    const summary = buildSlackSummary(PROJECTS, slackEvents);
    if (summary) {
        await sendSlackNotification(summary);
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
