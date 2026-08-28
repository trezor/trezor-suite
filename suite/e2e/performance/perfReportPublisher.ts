import * as fs from 'node:fs';

import { resolveRunUrl, upsertStickyPrComment } from '@trezor/e2e-utils';
import {
    PERF_REPORT_MARKER,
    type ReportedMeasurement,
    formatMarkdownReport,
    perfReportComment,
    perfReportSection,
} from '@trezor/perf-e2e';

/**
 * Which slice of the shared comment this job owns. Every matrix entry writes into one comment, so
 * this has to tell them apart — and stay the same across runs, or a re-run appends a section beside
 * the stale one instead of replacing it.
 */
const sectionKey = () => process.env.PERF_REPORT_LABEL || process.env.GITHUB_JOB || 'e2e';

/** The job the numbers come from, as the section's title. Display only. */
const sectionHeading = () => process.env.PERF_REPORT_JOB || sectionKey();

const writeStepSummary = (markdown: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) {
        return;
    }

    fs.appendFileSync(summaryPath, `${markdown}\n\n`);
};

type PublishArgs = {
    measurements: readonly ReportedMeasurement[];
    budgetsPath: string;
    log: (message: string) => void;
};

export const publishPerfReport = async ({ measurements, budgetsPath, log }: PublishArgs) => {
    const label = sectionKey();
    const section = formatMarkdownReport(measurements, {
        heading: sectionHeading(),
        runUrl: resolveRunUrl(),
        budgetsPath,
    });

    try {
        writeStepSummary(section);
    } catch (error) {
        log(`Failed to write the performance report to the run summary: ${error}`);
    }

    try {
        const result = await upsertStickyPrComment({
            marker: PERF_REPORT_MARKER,
            buildBody: existingBody => perfReportComment({ existingBody, label, section }),
            holdsOwnContent: body => body.includes(perfReportSection({ label, section })),
        });
        log(`Performance report pull request comment: ${result}.`);
    } catch (error) {
        log(`Failed to comment the performance report on the pull request: ${error}`);
    }
};
