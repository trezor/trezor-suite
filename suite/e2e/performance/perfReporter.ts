import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import {
    Baselines,
    Limits,
    PerfJsonReport,
    PerfMetricKey,
    PerfMetrics,
    aggregateSamples,
    buildJsonReport,
    compareScenario,
    suggestLimits,
} from '@trezor/perf-e2e';

import { BASELINES, LIMITS } from './budgets';

const BUDGETS_MODULE_PATH = 'suite/e2e/performance/budgets.ts';

// GitHub Actions logs render ANSI, so a failure is visible at a glance.
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const paint = (text: string, ...codes: string[]) => `${codes.join('')}${text}${RESET}`;

const pad = (value: string, width: number) => value.padEnd(width);

const fmt = (value: number | null, unit: string) => {
    if (value === null) {
        return 'n/a';
    }
    const rounded = Math.round(value * 10) / 10;

    return unit === 'ms' ? `${rounded}ms` : `${rounded}`;
};

type Metric = PerfJsonReport['metrics'][number];

const fmtOfLimit = (metric: Metric) =>
    metric.ratioToLimit === null ? 'n/a' : `${Math.round(metric.ratioToLimit * 100)}%`;

const WELL_UNDER_LIMIT_RATIO = 0.5;

const isWellUnderLimit = (metric: Metric) =>
    metric.ratioToLimit !== null && metric.ratioToLimit <= WELL_UNDER_LIMIT_RATIO;

const colorMetricRow = (row: string, metric: Metric) => {
    if (metric.exceededLimit) {
        return paint(row, RED);
    }

    return isWellUnderLimit(metric) ? paint(row, GREEN) : row;
};

/**
 * The whole `budgets.ts` as it would look with this run's numbers in it, so refreshing the baseline
 * or raising a limit is one paste from the CI log — no re-run, no hunting for the file.
 */
const formatBudgetsModule = (baselines: Baselines, limits: Limits) =>
    [
        "import { type Baselines, type Limits } from '@trezor/perf-e2e';",
        '',
        '/** What each scenario costs today, measured on CI. Reference only, never enforced. */',
        `export const BASELINES: Baselines = ${JSON.stringify(baselines, null, 4)};`,
        '',
        '/** The highest value each metric may reach before the run fails. Raise deliberately. */',
        `export const LIMITS: Limits = ${JSON.stringify(limits, null, 4)};`,
    ].join('\n');

const parseReport = (body: Buffer | undefined): PerfJsonReport | null => {
    try {
        return JSON.parse(String(body)) as PerfJsonReport;
    } catch {
        // A malformed attachment must not take the whole report down with it.
        return null;
    }
};

const toMetrics = (report: PerfJsonReport): PerfMetrics =>
    report.metrics.reduce<PerfMetrics>(
        (metrics, metric) => ({ ...metrics, [metric.key as PerfMetricKey]: metric.current }),
        {} as PerfMetrics,
    );

const scenarioVerdict = (report: PerfJsonReport) => {
    if (report.overLimit) {
        return paint('OVER LIMIT', BOLD, RED);
    }

    return report.unlimited ? 'no limits set (nothing measured against)' : 'within limits';
};

/**
 * Makes a breach visible on the run's summary page without failing anything: an `error` annotation
 * renders red there, while the exit code stays the job's own. No-op outside GitHub Actions, where the
 * console table is the whole report.
 */
const annotateOverLimit = (scenarios: string[]) => {
    if (!process.env.GITHUB_ACTIONS || scenarios.length === 0) {
        return;
    }

    // Scenario names go in the message, not in `title=`: workflow-command properties are
    // comma-separated, so a comma in the title would start another property.
    // eslint-disable-next-line no-console
    console.log(
        `::error title=Performance over limit::${scenarios.join(', ')} — see PERFORMANCE REPORT in this job's log. Does not fail the run.`,
    );
};

/**
 * End-of-run summary: collects the `perf-report-*.json` attachments, aggregates retries into one
 * median block per scenario, and prints the table last.
 */
class PerfReporter implements Reporter {
    private readonly reports: PerfJsonReport[] = [];

    onTestEnd(_test: TestCase, result: TestResult) {
        const reports = result.attachments
            .filter(attachment => attachment.name.startsWith('perf-report-') && attachment.body)
            .map(attachment => parseReport(attachment.body))
            .filter((report): report is PerfJsonReport => report !== null);

        this.reports.push(...reports);
    }

    onEnd(_result: FullResult) {
        if (this.reports.length === 0) {
            return;
        }

        // Aggregate retries: one median comparison per scenario (a test may run 2-3× on CI).
        const samplesByScenario = this.reports.reduce<Record<string, PerfMetrics[]>>(
            (samples, report) => ({
                ...samples,
                [report.scenario]: [...(samples[report.scenario] ?? []), toMetrics(report)],
            }),
            {},
        );

        const scenarios = Object.entries(samplesByScenario).map(([scenario, samples]) => {
            const median = aggregateSamples(samples);
            const comparison = compareScenario(
                scenario,
                median,
                BASELINES[scenario],
                LIMITS[scenario],
            );

            return {
                scenario,
                median,
                comparison,
                runs: samples.length,
                report: buildJsonReport(comparison),
            };
        });

        const overLimit = scenarios.filter(entry => entry.report.overLimit);
        const headerColor = overLimit.length > 0 ? [BOLD, RED] : [BOLD, GREEN];

        const lines: string[] = [
            '',
            paint('━'.repeat(72), ...headerColor),
            paint('PERFORMANCE REPORT', ...headerColor),
            paint('━'.repeat(72), ...headerColor),
        ];

        lines.push(
            ...scenarios.flatMap(({ scenario, report, runs }) => [
                '',
                `Scenario: ${scenario}  (median of ${runs} run${runs === 1 ? '' : 's'})   →   ${scenarioVerdict(report)}`,
                `  ${pad('metric', 24)}${pad('current', 12)}${pad('limit', 12)}${pad('% of limit', 12)}baseline`,
                ...report.metrics.map(metric =>
                    colorMetricRow(
                        `  ${pad(metric.label, 24)}${pad(fmt(metric.current, metric.unit), 12)}` +
                            `${pad(fmt(metric.limit, metric.unit), 12)}${pad(fmtOfLimit(metric), 12)}` +
                            `${fmt(metric.baseline, metric.unit)}${metric.exceededLimit ? ' !!' : ''}`,
                        metric,
                    ),
                ),
            ]),
            '',
            paint('─'.repeat(72), ...headerColor),
        );

        if (overLimit.length > 0) {
            lines.push(
                paint(
                    `Result: over limit — ${overLimit.map(e => e.scenario).join(', ')}. Reported only, the run is not failed.`,
                    BOLD,
                    RED,
                ),
            );
        } else {
            lines.push(paint('Result: within limits.', BOLD, GREEN));
        }

        // Both numbers in one paste: the baseline refreshed to this run, and every limit lifted to
        // fit it where the run went over. Untouched scenarios are preserved.
        const updatedBaselines: Baselines = {
            ...BASELINES,
            ...Object.fromEntries(scenarios.map(entry => [entry.scenario, entry.median])),
        };
        const updatedLimits: Limits = {
            ...LIMITS,
            ...suggestLimits(scenarios.map(entry => entry.comparison)),
        };

        lines.push(
            '',
            `To record this run's numbers, run from the repo root then commit`,
            '(the baseline is reference only; a raised limit says the app may cost more):',
            '',
            `cat > ${BUDGETS_MODULE_PATH} <<'TS'`,
            formatBudgetsModule(updatedBaselines, updatedLimits),
            'TS',
        );

        lines.push(paint('━'.repeat(72), ...headerColor), '');

        // eslint-disable-next-line no-console
        console.log(lines.join('\n'));

        annotateOverLimit(overLimit.map(entry => entry.scenario));
    }
}

/* eslint-disable-next-line import/no-default-export */
export default PerfReporter;
