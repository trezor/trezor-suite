import { type PerfJsonReport, formatMetricValue } from './report';

export type ReportedMeasurement = {
    key: string;
    runs: number;
    report: PerfJsonReport;
};

export type MarkdownReportContext = {
    label?: string;
    runUrl?: string;
    budgetsSnippet?: { path: string; contents: string };
};

export const PERF_REPORT_MARKER = '<!-- PERF-E2E-REPORT -->';

const PERF_REPORT_HEADING = '## ⚡ Performance report';

const safeLabel = (label: string) => label.replace(/[^a-zA-Z0-9._/ -]/g, '').replace(/-{2,}/g, '-');

const sectionMarkers = (label: string) => ({
    start: `<!-- PERF-E2E-SECTION:${safeLabel(label)}:START -->`,
    end: `<!-- PERF-E2E-SECTION:${safeLabel(label)}:END -->`,
});

const escapeCell = (value: string) => value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|');

type Metric = PerfJsonReport['metrics'][number];

const ratioToLimit = (metric: Metric) =>
    metric.ratioToLimit === null ? 'n/a' : `${Math.round(metric.ratioToLimit * 100)}%`;

const ratioToBaseline = ({ baseline, current }: Metric) => {
    if (baseline === null || baseline <= 0 || current === null) {
        return 'n/a';
    }

    const percentage = Math.round((current / baseline) * 100);

    return percentage < 100 ? `**${percentage}%**` : `${percentage}%`;
};

const verdict = (report: PerfJsonReport) => {
    if (report.overLimit) {
        return '🔴 over limit';
    }

    return report.unlimited ? '⚪ no limits set' : '🟢 within limits';
};

const measurementSection = ({ key, runs, report }: ReportedMeasurement) =>
    [
        `<details${report.overLimit ? ' open' : ''}>`,
        `<summary><code>${escapeCell(key)}</code> — ${verdict(report)} — median of ${runs} run${runs === 1 ? '' : 's'}</summary>`,
        '',
        '| Metric | Current | Limit | % of limit | Baseline | % of baseline |',
        '| --- | --: | --: | --: | --: | --: |',
        ...report.metrics.map(metric => {
            const cells = [
                escapeCell(metric.label) + (metric.exceededLimit ? ' ⚠️' : ''),
                formatMetricValue(metric.current, metric.unit),
                formatMetricValue(metric.limit, metric.unit),
                ratioToLimit(metric),
                formatMetricValue(metric.baseline, metric.unit),
                ratioToBaseline(metric),
            ];

            return `| ${cells.join(' | ')} |`;
        }),
        '',
        '</details>',
    ].join('\n');

const STALE_BASELINE_RATIO = 0.9;

const belowBaselineDrops = ({ report }: ReportedMeasurement) =>
    report.metrics.flatMap(({ label, baseline, current }) => {
        if (baseline === null || baseline <= 0 || current === null) {
            return [];
        }

        const ratio = current / baseline;

        return ratio < STALE_BASELINE_RATIO ? [`${label} −${Math.round((1 - ratio) * 100)}%`] : [];
    });

const belowBaselineNote = (measurements: readonly ReportedMeasurement[]) => {
    const improved = measurements
        .map(measurement => ({ key: measurement.key, drops: belowBaselineDrops(measurement) }))
        .filter(entry => entry.drops.length > 0);

    if (improved.length === 0) {
        return [];
    }

    const listed = improved.map(entry => `\`${entry.key}\` (${entry.drops.join(', ')})`);

    return [
        '',
        `🔵 **Under baseline:** ${listed.join('; ')} — the baseline is stale, record this run's numbers below to lower it.`,
    ];
};

export const formatMarkdownReport = (
    measurements: readonly ReportedMeasurement[],
    { label, runUrl, budgetsSnippet }: MarkdownReportContext = {},
): string => {
    const overLimit = measurements.filter(measurement => measurement.report.overLimit);
    const heading = label ? `### ${label}` : '### e2e';

    const summary =
        overLimit.length > 0
            ? `🔴 **Over limit:** ${overLimit.map(measurement => `\`${measurement.key}\``).join(', ')} — reported only, the run is not failed.`
            : '🟢 **Within limits.**';

    const lines = [
        heading,
        '',
        summary,
        ...belowBaselineNote(measurements),
        '',
        ...measurements.map(measurementSection),
    ];

    if (budgetsSnippet) {
        lines.push(
            '',
            `<details>`,
            `<summary>Record this run's numbers</summary>`,
            '',
            `Run from the repo root, then commit. The baseline is reference only; a raised limit says the app may cost more.`,
            '',
            '```bash',
            `cat > ${budgetsSnippet.path} <<'TS'`,
            budgetsSnippet.contents,
            'TS',
            '```',
            '',
            '</details>',
        );
    }

    if (runUrl) {
        lines.push('', `Measured in [this run](${runUrl}).`);
    }

    return lines.join('\n');
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

    if (startIndex !== -1 && endIndex > startIndex) {
        return (
            existingBody.slice(0, startIndex) + block + existingBody.slice(endIndex + end.length)
        );
    }

    const base = existingBody.includes(PERF_REPORT_MARKER)
        ? existingBody.trimEnd()
        : `${PERF_REPORT_MARKER}\n${PERF_REPORT_HEADING}`;

    return `${base}\n\n${block}`;
};
