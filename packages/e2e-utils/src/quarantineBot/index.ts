import { getAutoQuarantineActions } from './api';
import {
    EXPLORER_LOOKBACK_DAYS,
    PROJECTS,
    QUARANTINE_FAILURE_RATE,
    QUARANTINE_LAST_N_EXECUTIONS,
    UNQUARANTINE_FAILURE_RATE,
    UNQUARANTINE_LAST_N_EXECUTIONS,
} from './config';
import { listAllQuarantinedTests } from './list';
import { quarantineFromRun } from './manualQuarantine';
import { nightlyUnquarantineFromLatestRun } from './nightlyUnquarantine';
import { quarantineFailingTests, unquarantinePassingTests } from './quarantine';
import { buildSlackSummary, sendSlackNotification } from './slack';
import type { SlackEvent } from './types';
import { wipeAllAutoQuarantineActions } from './wipe';
import { getActiveTests } from '../currentsApi/api';
import { configureLogLevelFromArgs, createLogger, printProblemSummary } from '../logger';

const logger = createLogger('healthcheck');

/**
 * Print a per-project outcome table followed by the collected problems section.
 * Returns the number of errors so the caller can set the exit code.
 */
function logRunSummary(
    projects: Array<{ id: string; label: string }>,
    events: SlackEvent[],
): number {
    logger.log('\n=== Summary ===');
    for (const project of projects) {
        const quarantined = events.filter(
            e => e.projectId === project.id && e.kind === 'quarantined',
        ).length;
        const restored = events.filter(
            e => e.projectId === project.id && e.kind === 'unquarantined',
        ).length;
        logger.log(`  ${project.label}: ${quarantined} quarantined, ${restored} restored`);
    }

    return printProblemSummary();
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // Resolve the log level first so every subsequent log honours it.
    configureLogLevelFromArgs(args);

    logger.debug('args:', args);
    logger.debug(
        'env: CURRENTS_API_KEY',
        process.env.CURRENTS_API_KEY ? 'present' : 'MISSING',
        '| E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK',
        process.env.E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK ? 'present' : 'not set',
        '| GITHUB_RUN_ID',
        process.env.GITHUB_RUN_ID ?? 'not set',
    );

    if (args.includes('--help') || args.includes('-h')) {
        logger.log(
            [
                'Usage: yarn workspace @trezor/e2e-utils test-health [options]',
                '',
                'Options:',
                '  (no args)                  Run the test health check: quarantine newly failing tests and',
                '                             unquarantine tests that have recovered.',
                '',
                '  --list                     List all currently quarantined tests for every monitored project.',
                '                             Outputs a JSON report to stdout; progress messages go to stderr.',
                '                             Combine with --project to narrow to a single project.',
                '',
                '  --list --project <name>    Same as --list but limited to the specified project.',
                `                             Known project names: ${PROJECTS.map(p => p.name).join(', ')}.`,
                '',
                '  --quarantine <runId>       Quarantine all tests that failed in the given Currents run ID.',
                '                             Combine with -i / --interactive to approve each test manually.',
                '                             Sends a Slack notification (with a "manually triggered" note)',
                '                             when E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK is configured.',
                '',
                '  -i, --interactive          Used together with --quarantine: prompt for each failed test',
                '                             before quarantining it.',
                '',
                '  --wipeAutoQuarantine       Delete ALL auto-quarantine actions (those created by this bot)',
                '                             across every monitored project. Use with caution.',
                '',
                '  --nightlyUnquarantine      Find the latest run on the default (develop) branch for',
                '                             each monitored project and unquarantine all auto-quarantined',
                '                             tests that passed in that run.',
                '',
                '  --log-level <level>        Set logging verbosity: error | warn | info | debug | trace.',
                '                             Default: debug. Raw HTTP requests/responses are only shown at',
                '                             trace. All logging goes to stderr (stdout stays reserved for',
                '                             machine-readable output such as --list JSON).',
                '',
                '  --help, -h                 Show this help message and exit.',
                '',
                'Environment variables:',
                '  CURRENTS_API_KEY                          (required) API key for the Currents.dev API.',
                '  E2E_TEST_SLACK_QUARANTINE_BOT_WEBHOOK     (optional) Slack incoming-webhook URL for',
                '                                            quarantine/unquarantine notifications.',
                '  LOG_LEVEL                                 (optional) Default log level (see --log-level).',
            ].join('\n'),
        );

        return;
    }

    if (args.includes('--list')) {
        const projectFlagIndex = args.indexOf('--project');
        const projectNameFilter = projectFlagIndex !== -1 ? args[projectFlagIndex + 1] : undefined;
        logger.debug(
            'operation: list',
            projectNameFilter ? `project=${projectNameFilter}` : '(all projects)',
        );
        await listAllQuarantinedTests(projectNameFilter);

        return;
    }

    if (args.includes('--wipeAutoQuarantine')) {
        logger.debug('operation: wipeAutoQuarantine');
        await wipeAllAutoQuarantineActions();

        return;
    }

    if (args.includes('--nightlyUnquarantine')) {
        logger.debug('operation: nightlyUnquarantine');
        logger.log('=== Nightly Unquarantine ===');
        logger.log(`Timestamp: ${new Date().toISOString()}`);
        logger.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
        logger.log('');

        const slackEvents: SlackEvent[] = [];

        for (const project of PROJECTS) {
            try {
                await nightlyUnquarantineFromLatestRun(project.id, project.label, slackEvents);
            } catch (err) {
                logger.error(`Failed processing project ${project.label} (${project.id}):`, err);
            }
        }

        const summary = buildSlackSummary(PROJECTS, slackEvents, {
            headerNote: 'Nightly unquarantine from latest develop run.',
        });
        if (summary) {
            await sendSlackNotification(summary);
        }

        const errorCount = logRunSummary(PROJECTS, slackEvents);
        logger.log('\n=== Done ===');

        if (errorCount > 0) {
            process.exit(1);
        }

        return;
    }

    const quarantineFlagIndex = args.indexOf('--quarantine');
    if (quarantineFlagIndex !== -1) {
        const runId = args[quarantineFlagIndex + 1];
        if (!runId || runId.startsWith('-')) {
            logger.error('--quarantine requires a run ID argument.');
            process.exit(1);
        }

        const interactive = args.includes('-i') || args.includes('--interactive');
        logger.debug('operation: quarantine', `runId=${runId}`, `interactive=${interactive}`);
        const slackEvents: SlackEvent[] = [];

        const { projectId, projectLabel } = await quarantineFromRun(
            runId,
            interactive,
            slackEvents,
        );

        // Build Slack summary using the run's project so the events are attributed correctly.
        const projectEntry = { id: projectId, label: projectLabel };
        const summary = buildSlackSummary([projectEntry], slackEvents, {
            headerNote: `Manually triggered quarantine from <https://app.currents.dev/runs/${runId}|run ${runId}>.`,
        });
        if (summary) {
            await sendSlackNotification(summary);
        }

        const errorCount = logRunSummary([projectEntry], slackEvents);
        logger.log('\n=== Done ===');

        if (errorCount > 0) {
            process.exit(1);
        }

        return;
    }

    logger.debug('operation: healthcheck');
    logger.log('=== Currents Test Health Check ===');
    logger.log(`Timestamp: ${new Date().toISOString()}`);
    logger.log(`Projects: ${PROJECTS.map(p => `${p.label} (${p.id})`).join(', ')}`);
    logger.log(
        `Thresholds: quarantine ≥${QUARANTINE_FAILURE_RATE * 100}% failures over last ${QUARANTINE_LAST_N_EXECUTIONS} executions, ` +
            `unquarantine ≤${UNQUARANTINE_FAILURE_RATE * 100}% failures over last ${UNQUARANTINE_LAST_N_EXECUTIONS} executions (using Test Results API)`,
    );
    logger.log('');

    const slackEvents: SlackEvent[] = [];

    for (const project of PROJECTS) {
        try {
            const [existingActions, activeTests] = await Promise.all([
                getAutoQuarantineActions(project.id),
                getActiveTests(project.id, EXPLORER_LOOKBACK_DAYS),
            ]);
            logger.debug(
                `project ${project.label}: ${existingActions.length} existing auto-quarantine action(s),`,
                `${activeTests.length} active test(s) in explorer window`,
            );
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
            logger.error(`Failed processing project ${project.label} (${project.id}):`, err);
        }
    }

    const summary = buildSlackSummary(PROJECTS, slackEvents);
    if (summary) {
        await sendSlackNotification(summary);
    }

    const errorCount = logRunSummary(PROJECTS, slackEvents);
    logger.log('\n=== Done ===');

    if (errorCount > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    logger.error('[FATAL]', err);
    process.exit(1);
});
