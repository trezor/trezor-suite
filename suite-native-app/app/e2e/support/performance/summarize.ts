/* eslint-disable no-console */
import { appendFileSync, existsSync, readFileSync } from 'fs';

import { summarizeReport } from './summary';
import type { PerformanceReport } from './types';

/**
 * CI entry point: renders the run's performance report into the job summary.
 *
 * Never fails the job, and never fails the run it describes. A report that is missing or
 * unreadable costs the job its summary and says so; the numbers inside one never decide a verdict.
 */

const { PERF_REPORT } = process.env;
const SHARD = process.env.SHARD ?? 'unknown';

const warn = (message: string) =>
    console.log(`::warning title=Native performance summary::${message}`);

const main = () => {
    if (!PERF_REPORT) {
        warn('PERF_REPORT is not set, so there is nothing to summarize.');

        return;
    }

    if (!existsSync(PERF_REPORT)) {
        console.log(`No performance report at ${PERF_REPORT}, nothing to summarize.`);

        return;
    }

    const report = JSON.parse(readFileSync(PERF_REPORT, 'utf8')) as PerformanceReport;
    const { markdown, overLimit } = summarizeReport(report, SHARD);

    if (process.env.GITHUB_STEP_SUMMARY) {
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
    } else {
        console.log(markdown);
    }

    if (overLimit.length > 0) {
        console.log(
            `::warning title=Native performance over limit::${overLimit.join(', ')}, ` +
                'see this job summary. Does not fail the run.',
        );
    }
};

try {
    main();
} catch (error) {
    warn(
        `could not render ${PERF_REPORT}: ${error instanceof Error ? error.message : String(error)}`,
    );
}
