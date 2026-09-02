import { type PerfJsonReport, formatMetricNumber, formatMetricValue } from './report';
import { type PerfMetricKey, type ScenarioLimits } from './types';

export type ReportedMeasurement = {
    key: string;
    runs: number;
    report: PerfJsonReport;
    /**
     * The limit each metric that went over would need to fit this run. Rendered as the edit to make
     * in the budgets module, so raising a limit stays a reviewed decision rather than a paste.
     */
    suggestedLimits?: ScenarioLimits;
};

export type MarkdownReportContext = {
    /**
     * The section title — the job these numbers come from. Display only: the section key travels
     * separately, because it has to stay the same across runs and this does not.
     */
    heading?: string;
    runUrl?: string;
    /** Where the limits live, named in the note that offers to raise one. */
    budgetsPath?: string;
};

export const PERF_REPORT_MARKER = '<!-- PERF-E2E-REPORT -->';

const PERF_REPORT_HEADING = '## ⚡️ Performance report (alpha)';

/**
 * What the numbers are worth. A measurement here is usually a single run on a shared CI runner, so
 * a difference has to be large before it means anything — said once, at the top, rather than hedged
 * into every section.
 */
const PERF_REPORT_NOTE = [
    '> [!NOTE]',
    '> **Alpha release:** The limits are still being calibrated, and each measurement is',
    '> usually a single run on a shared CI runner, so expect noise between runs. Treat a',
    '> number as a hint to look closer, not as a verdict.',
].join('\n');

const PERF_REPORT_PREAMBLE = `${PERF_REPORT_MARKER}\n${PERF_REPORT_HEADING}\n\n${PERF_REPORT_NOTE}`;

const SECTION_START = '<!-- PERF-E2E-SECTION:';

/**
 * Column headings for the one-row-per-scenario table. The full metric labels are written for a
 * console report that has a line per metric; six of them side by side wrap every cell in a comment.
 * Keyed by metric so a new one cannot be left without a heading.
 */
const COLUMN_HEADINGS: Record<PerfMetricKey, string> = {
    totalBlockingTimeMs: 'TBT',
    longTaskCount: 'Long tasks',
    longestTaskMs: 'Longest task',
    reactCommitCount: 'React commits',
    interactionDurationMs: 'Interaction',
};

const safeLabel = (label: string) => label.replace(/[^a-zA-Z0-9._/ -]/g, '').replace(/-{2,}/g, '-');

const sectionMarkers = (label: string) => ({
    start: `<!-- PERF-E2E-SECTION:${safeLabel(label)}:START -->`,
    end: `<!-- PERF-E2E-SECTION:${safeLabel(label)}:END -->`,
});

/** For a table cell, where an unescaped pipe would start a new column. */
const escapeCell = (value: string) => value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

/** For markup we write by hand, where a pipe needs no escaping but a bracket would break the tag. */
const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Metric = PerfJsonReport['metrics'][number];

const exceededMetrics = (report: PerfJsonReport) =>
    report.metrics.filter(metric => metric.exceededLimit);

/**
 * `measured/limit (% of limit)`. Carrying the limit in the cell is what lets a number be read as
 * fine or not without looking anything up. A metric with no limit has nothing to divide by, so it
 * stays the bare measurement.
 */
const metricCell = (metric: Metric): string => {
    if (metric.current === null || metric.limit === null || metric.ratioToLimit === null) {
        return formatMetricValue(metric.current, metric.unit);
    }

    const measured = `${formatMetricNumber(metric.current)}/${formatMetricValue(metric.limit, metric.unit)}`;
    const share = `(${Math.round(metric.ratioToLimit * 100)} %)`;

    // Each half is emphasised on its own rather than the pair as a whole: `**a<br>b**` leans on an
    // emphasis run surviving raw HTML, and a cell that renders literal asterisks is worse than a
    // slightly longer line here.
    return metric.exceededLimit ? `⚠️ **${measured}**<br>**${share}**` : `${measured}<br>${share}`;
};

/**
 * A sample count only says something when a retry actually happened — "median of 1" is not a median,
 * and repeating it down a column costs more than it tells.
 */
const scenarioCell = ({ key, runs, report }: ReportedMeasurement) =>
    [
        `\`${escapeCell(key)}\``,
        report.unlimited ? '⚪' : '',
        runs > 1 ? `<sub>median of ${runs}</sub>` : '',
    ]
        .filter(Boolean)
        .join(' ');

const measurementTable = (measurements: readonly ReportedMeasurement[]): string[] => {
    // Every comparison is built from the same metric registry, so the first measurement's metrics
    // give the columns and each row is read back by key against them.
    const keys = measurements[0]?.report.metrics.map(metric => metric.key) ?? [];

    return [
        `| Scenario | ${keys.map(key => COLUMN_HEADINGS[key]).join(' | ')} |`,
        `| --- | ${keys.map(() => '--:').join(' | ')} |`,
        ...measurements.map(measurement => {
            const byKey = new Map(measurement.report.metrics.map(metric => [metric.key, metric]));
            const cells = keys.map(key => {
                const metric = byKey.get(key);

                return metric ? metricCell(metric) : 'n/a';
            });

            return `| ${scenarioCell(measurement)} | ${cells.join(' | ')} |`;
        }),
    ];
};

/**
 * The edit that would make this run fit, as a diff rather than the whole budgets module: several
 * jobs report into one comment, and a full-file paste from any of them discards what the others
 * measured.
 */
const limitRaiseDiff = ({ key, report, suggestedLimits }: ReportedMeasurement): string[] => {
    const raises = exceededMetrics(report).flatMap(metric => {
        const suggested = suggestedLimits?.[metric.key];

        return suggested === undefined ? [] : [{ metric, suggested }];
    });

    if (raises.length === 0) {
        return [];
    }

    return [
        '```diff',
        ` "${key}": {`,
        ...raises.flatMap(({ metric, suggested }) => [
            `-    "${metric.key}": ${metric.limit},`,
            `+    "${metric.key}": ${suggested},`,
        ]),
        ' }',
        '```',
    ];
};

/**
 * Unfolded, and only for a measurement that went over: the one case where the report is asking for a
 * decision rather than reporting a number.
 */
const overLimitShowcase = (
    measurement: ReportedMeasurement,
    budgetsPath: string | undefined,
): string[] => {
    const breached = exceededMetrics(measurement.report)
        .map(metric => metric.label)
        .join(', ');
    const diff = limitRaiseDiff(measurement);

    return [
        '',
        '<details open>',
        `<summary>⚠️ <code>${escapeHtml(measurement.key)}</code> — ${breached} over limit</summary>`,
        '',
        ...(diff.length > 0
            ? [
                  `Raise the limit only if the app is meant to cost more${budgetsPath ? `, in \`${budgetsPath}\`` : ''}:`,
                  '',
                  ...diff,
                  '',
              ]
            : []),
        '</details>',
    ];
};

const WITHIN_LIMITS_SUMMARY = '🟢 <strong>Within limits.</strong>';

const overLimitSummary = (overLimit: readonly ReportedMeasurement[]) => {
    const listed = overLimit.map(measurement => {
        const breached = exceededMetrics(measurement.report)
            .map(metric => metric.label)
            .join(', ');

        return `<code>${escapeHtml(measurement.key)}</code> (${breached})`;
    });

    return `🔴 <strong>Over limit</strong> — ${listed.join('; ')} — reported only, the run is not failed.`;
};

/**
 * Reads the table for anyone who has not seen this report before. Each clause is added only when the
 * table actually contains what it explains, so a passing run stays one sentence.
 */
const legend = (measurements: readonly ReportedMeasurement[]) =>
    [
        'Each metric reads <code>measured/limit (% of limit)</code>.',
        measurements.some(measurement => measurement.report.overLimit)
            ? '⚠️ marks a metric over its limit.'
            : '',
        measurements.some(measurement => measurement.report.unlimited)
            ? '⚪ marks a scenario with no limits set.'
            : '',
    ]
        .filter(Boolean)
        .join(' ');

export const formatMarkdownReport = (
    measurements: readonly ReportedMeasurement[],
    { heading = 'e2e', runUrl, budgetsPath }: MarkdownReportContext = {},
): string => {
    const overLimit = measurements.filter(measurement => measurement.report.overLimit);

    return [
        runUrl ? `### [${heading}](${runUrl})` : `### ${heading}`,
        '',
        // Folded away when there is nothing to answer for, so a pull request carrying several of
        // these reads as a list of verdicts; unfolded the moment one is asking for a decision.
        overLimit.length > 0 ? '<details open>' : '<details>',
        `<summary>${overLimit.length > 0 ? overLimitSummary(overLimit) : WITHIN_LIMITS_SUMMARY}</summary>`,
        '',
        `<sub>${legend(measurements)}</sub>`,
        '',
        ...measurementTable(measurements),
        ...overLimit.flatMap(measurement => overLimitShowcase(measurement, budgetsPath)),
        '',
        '</details>',
    ].join('\n');
};

export const perfReportSection = ({
    label,
    section,
}: {
    label: string;
    section: string;
}): string => {
    const { start, end } = sectionMarkers(label);

    return `${start}\n${section}\n${end}`;
};

export const perfReportComment = ({
    existingBody = '',
    label,
    section,
}: {
    existingBody?: string;
    label: string;
    section: string;
}): string => {
    const { start, end } = sectionMarkers(label);
    const block = perfReportSection({ label, section });

    const startIndex = existingBody.indexOf(start);
    const endIndex = existingBody.indexOf(end);

    const updated =
        startIndex !== -1 && endIndex > startIndex
            ? existingBody.slice(0, startIndex) + block + existingBody.slice(endIndex + end.length)
            : `${existingBody.trimEnd()}\n\n${block}`;

    // The preamble is rewritten on every pass rather than only when the comment is created, so a
    // comment an older run started does not keep wording the report has since moved on from.
    const sections = updated.indexOf(SECTION_START);

    return `${PERF_REPORT_PREAMBLE}\n\n${(sections === -1 ? updated : updated.slice(sections)).trim()}`;
};
