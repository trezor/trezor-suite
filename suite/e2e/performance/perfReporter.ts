import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import chalk from 'chalk';

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

const fmt = (value: number | null, unit: string) => {
    if (value === null) {
        return 'n/a';
    }
    const rounded = Math.round(value * 10) / 10;

    return unit === 'ms' ? `${rounded}ms` : `${rounded}`;
};

type Metric = PerfJsonReport['metrics'][number];

type MeasuredRun = { project: string; testId: string; report: PerfJsonReport };

type MeasurementSamples = { scenario: string; project: string; metrics: PerfMetrics[] };

/** Names one measured run of a scenario, which is one scenario on one device model. */
const measurementLabel = (scenario: string, project: string) =>
    project ? `${scenario} [${project}]` : scenario;

const fmtOfLimit = (metric: Metric) =>
    metric.ratioToLimit === null ? 'n/a' : `${Math.round(metric.ratioToLimit * 100)}%`;

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
        '/** The highest value each metric may reach before it is reported as over limit. Raise deliberately. */',
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
        return chalk.bold.red('OVER LIMIT');
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
    private readonly reports: MeasuredRun[] = [];

    onTestEnd(test: TestCase, result: TestResult) {
        // A scenario is measured once per device model, and a retry repeats the very same test, so
        // only the test and its project together say which runs are samples of one another.
        const project = test.parent?.project()?.name ?? '';

        const runs = result.attachments
            .filter(attachment => attachment.name.startsWith('perf-report-') && attachment.body)
            .map(attachment => parseReport(attachment.body))
            .filter((report): report is PerfJsonReport => report !== null)
            .map(report => ({ project, testId: test.id, report }));

        this.reports.push(...runs);
    }

    onEnd(_result: FullResult) {
        if (this.reports.length === 0) {
            return;
        }

        // Aggregate retries: one median comparison per measurement (a test may run 2-3× on CI).
        // Grouping by scenario alone would average a slow device model with a fast one and hide a
        // breach in the middle.
        const samplesByMeasurement = this.reports.reduce<Record<string, MeasurementSamples>>(
            (samples, { project, testId, report }) => {
                const key = `${project}\u0000${testId}\u0000${report.scenario}`;
                const existing = samples[key];

                return {
                    ...samples,
                    [key]: {
                        scenario: report.scenario,
                        project,
                        metrics: [...(existing?.metrics ?? []), toMetrics(report)],
                    },
                };
            },
            {},
        );

        const scenarios = Object.values(samplesByMeasurement).map(
            ({ scenario, project, metrics }) => {
                const median = aggregateSamples(metrics);
                const comparison = compareScenario(
                    scenario,
                    median,
                    BASELINES[scenario],
                    LIMITS[scenario],
                );

                return {
                    scenario,
                    project,
                    median,
                    comparison,
                    runs: metrics.length,
                    report: buildJsonReport(comparison),
                };
            },
        );

        const overLimit = scenarios.filter(entry => entry.report.overLimit);
        // Chalk keeps its colors in GitHub Actions logs, so a failure is visible at a glance.
        const headerStyle = overLimit.length > 0 ? chalk.bold.red : chalk.bold.green;

        const lines: string[] = [
            '',
            headerStyle('━'.repeat(72)),
            headerStyle('PERFORMANCE REPORT'),
            headerStyle('━'.repeat(72)),
        ];

        lines.push(
            ...scenarios.flatMap(({ scenario, project, report, runs }) => [
                '',
                `Scenario: ${measurementLabel(scenario, project)}  (median of ${runs} run${runs === 1 ? '' : 's'})   →   ${scenarioVerdict(report)}`,
                `  ${'metric'.padEnd(24)}${'current'.padEnd(12)}${'limit'.padEnd(12)}${'% of limit'.padEnd(12)}baseline`,
                ...report.metrics.map(metric => {
                    const row =
                        `  ${metric.label.padEnd(24)}${fmt(metric.current, metric.unit).padEnd(12)}` +
                        `${fmt(metric.limit, metric.unit).padEnd(12)}${fmtOfLimit(metric).padEnd(12)}` +
                        `${fmt(metric.baseline, metric.unit)}${metric.exceededLimit ? ' !!' : ''}`;

                    return metric.exceededLimit ? chalk.red(row) : row;
                }),
            ]),
            '',
            headerStyle('─'.repeat(72)),
        );

        if (overLimit.length > 0) {
            lines.push(
                chalk.bold.red(
                    `Result: over limit — ${overLimit.map(e => measurementLabel(e.scenario, e.project)).join(', ')}. Reported only, the run is not failed.`,
                ),
            );
        } else {
            lines.push(chalk.bold.green('Result: within limits.'));
        }

        // Both numbers in one paste: the baseline refreshed to this run, and every limit lifted to
        // fit it where the run went over. Untouched scenarios are preserved. Where a scenario ran on
        // more than one device model, the last one measured is the baseline recorded for it, while
        // the limit fits them all (see `suggestLimits`).
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

        lines.push(headerStyle('━'.repeat(72)), '');

        // eslint-disable-next-line no-console
        console.log(lines.join('\n'));

        annotateOverLimit(overLimit.map(entry => measurementLabel(entry.scenario, entry.project)));
    }
}

/* eslint-disable-next-line import/no-default-export */
export default PerfReporter;
