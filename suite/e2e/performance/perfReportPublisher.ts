import * as fs from 'node:fs';

import { resolveRunUrl, upsertStickyPrComment } from '@trezor/e2e-utils';
import {
    PERF_REPORT_MARKER,
    type ReportedMeasurement,
    formatCommentSection,
    formatMarkdownReport,
    mergeMeasurements,
    perfReportComment,
    readSectionMeasurements,
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

const sectionContext = (args: PublishArgs) => ({
    heading: sectionHeading(),
    runUrl: resolveRunUrl(),
    budgetsPath: args.budgetsPath,
});

/**
 * Rendered from what the section already reported plus this run's measurements. The section is read
 * again on every attempt, so a publish that lands between the read and the write is merged in rather
 * than dropped.
 */
const buildCommentSection = (
    existingBody: string | undefined,
    args: PublishArgs & { label: string },
) =>
    formatCommentSection(
        mergeMeasurements(
            readSectionMeasurements({ body: existingBody, label: args.label }),
            args.measurements,
        ),
        sectionContext(args),
    );

export const publishPerfReport = async (args: PublishArgs) => {
    const { measurements, log } = args;
    const label = sectionKey();

    try {
        writeStepSummary(formatMarkdownReport(measurements, sectionContext(args)));
    } catch (error) {
        log(`Failed to write the performance report to the run summary: ${error}`);
    }

    try {
        const result = await upsertStickyPrComment({
            marker: PERF_REPORT_MARKER,
            buildBody: existingBody =>
                perfReportComment({
                    existingBody,
                    label,
                    section: buildCommentSection(existingBody, { ...args, label }),
                }),
            // Started only by a flow over its limit; once it exists, every job keeps its line current.
            createIfMissing: measurements.some(measurement => measurement.report.overLimit),
            // Only this run's own measurements are checked for: another job merging into the same
            // section is not a loss, and demanding the whole section back would retry forever.
            holdsOwnContent: body => {
                const written = readSectionMeasurements({ body, label });

                return measurements.every(measurement =>
                    written.some(({ key }) => key === measurement.key),
                );
            },
        });
        log(`Performance report pull request comment: ${result}.`);
    } catch (error) {
        log(`Failed to comment the performance report on the pull request: ${error}`);
    }
};
