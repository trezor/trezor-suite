import * as fs from 'node:fs';

import { resolveRunUrl, upsertStickyPrComment } from '@trezor/e2e-utils';
import {
    PERF_REPORT_MARKER,
    type ReportedMeasurement,
    formatMarkdownReport,
    perfReportComment,
    perfReportSection,
} from '@trezor/perf-e2e';

const runLabel = () => process.env.PERF_REPORT_LABEL || process.env.GITHUB_JOB || 'e2e';

const writeStepSummary = (markdown: string) => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) {
        return;
    }

    fs.appendFileSync(summaryPath, `${markdown}\n\n`);
};

type PublishArgs = {
    measurements: readonly ReportedMeasurement[];
    budgetsSnippet: { path: string; contents: string };
    log: (message: string) => void;
};

export const publishPerfReport = async ({ measurements, budgetsSnippet, log }: PublishArgs) => {
    const label = runLabel();
    const section = formatMarkdownReport(measurements, {
        label,
        runUrl: resolveRunUrl(),
        budgetsSnippet,
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
