import chalk from 'chalk';

import { MetricDelta, ScenarioDelta, Verdict } from './delta';
import {
    ReportContext,
    VerdictCounts,
    countVerdicts,
    formatAge,
    formatPercent,
    formatValue,
    short,
    targetHeading,
    verdictSentence,
} from './format';
import { SampleIdentity } from './identity';

/**
 * The report markdown.ts writes for a PR, laid out for a shell instead: one block per measurement,
 * aligned columns, colour on the flagged rows. The shape follows perfReporter.ts — the other
 * end-of-run block a developer reads in the same terminal. Nothing collapses here: the PR body's
 * character budget is what forces that on the markdown, and a scrollback has no such limit.
 */

const RULE_WIDTH = 72;

/** `2 + 24 + 13 + 13` leaves the delta column ending around the rule above it. */
const COLUMN_WIDTHS = { metric: 24, value: 13 };

const MISSING = '—';

/** Colour is a bonus, not the message: the marks survive a pipe, a log file and colour blindness. */
const VERDICT_MARK: Record<Verdict, string> = { regression: ' !!', improvement: ' ++' };

const VERDICT_STYLE: Record<Verdict, (text: string) => string> = {
    regression: chalk.red,
    improvement: chalk.green,
};

const plural = (count: number) => (count === 1 ? '' : 's');

const deltaCell = ({ metric, baseline, current, verdict }: MetricDelta): string => {
    if (baseline === null || current === null) {
        return MISSING;
    }

    const diff = current - baseline;
    if (diff === 0) {
        return '±0';
    }

    const percent = formatPercent(baseline, current);
    const sign = diff > 0 ? '+' : '−';
    const mark = verdict ? VERDICT_MARK[verdict] : '';

    return `${sign}${formatValue(Math.abs(diff), metric.unit)}${percent ? ` (${percent})` : ''}${mark}`;
};

const metricRow = (row: MetricDelta): string => {
    const { metric, baseline, current, verdict } = row;
    const value = (amount: number | null) =>
        (amount === null ? MISSING : formatValue(amount, metric.unit)).padEnd(COLUMN_WIDTHS.value);

    const line = `  ${metric.label.padEnd(COLUMN_WIDTHS.metric)}${value(baseline)}${value(current)}${deltaCell(row)}`;

    return verdict ? VERDICT_STYLE[verdict](line) : line;
};

/**
 * Metrics keep the registry order `computeDeltas` produced them in; a metric neither side measured
 * is left out rather than printed as a row of dashes.
 */
const scenarioBlock = ({ identity, runs, metrics }: ScenarioDelta): string[] => {
    const rows = metrics.filter(row => row.baseline !== null || row.current !== null);
    if (rows.length === 0) {
        return [];
    }

    const header = `  ${'metric'.padEnd(COLUMN_WIDTHS.metric)}${'baseline'.padEnd(COLUMN_WIDTHS.value)}${'current'.padEnd(COLUMN_WIDTHS.value)}delta`;

    return [
        '',
        `${targetHeading(identity.target)} · ${identity.model} · ${identity.scenario}  (median of ${runs} run${plural(runs)})`,
        chalk.dim(header),
        ...rows.map(metricRow),
    ];
};

const byIdentity = (a: ScenarioDelta, b: ScenarioDelta) =>
    a.identity.target.localeCompare(b.identity.target) ||
    a.identity.model.localeCompare(b.identity.model) ||
    a.identity.scenario.localeCompare(b.identity.scenario);

/** Red on a regression, green on a clean comparison, plain when there was nothing to compare to. */
const resolveHeaderStyle = (counts: VerdictCounts, hasBaseline: boolean) => {
    if (!hasBaseline) {
        return chalk.bold;
    }

    if (counts.regressions > 0) {
        return chalk.bold.red;
    }

    return chalk.bold.green;
};

const resultLine = (counts: VerdictCounts, hasBaseline: boolean): string => {
    if (!hasBaseline) {
        return chalk.bold('Result: absolute values only — no baseline to compare against.');
    }

    if (counts.regressions > 0) {
        return chalk.bold.red(
            `Result: ${counts.regressions} regression${plural(counts.regressions)} flagged (rows marked !!). Reported only, nothing is gated.`,
        );
    }

    return chalk.bold.green('Result: no regression past the noise floors.');
};

export const renderTerminalReport = (
    deltas: ScenarioDelta[],
    missing: SampleIdentity[],
    context: ReportContext,
): string => {
    const counts = countVerdicts(deltas);
    const headerStyle = resolveHeaderStyle(counts, context.baseline !== null);
    const baselineNote = context.baseline
        ? `vs ${context.baseBranch} @ ${short(context.baseline.hash)} (baseline, ${formatAge(context.baseline.runAt)})`
        : `— no ${context.baseBranch} baseline reachable, absolute values only`;

    const lines: string[] = [
        '',
        headerStyle('━'.repeat(RULE_WIDTH)),
        headerStyle('PERFORMANCE DELTA REPORT'),
        headerStyle('━'.repeat(RULE_WIDTH)),
        `${context.branch} @ ${short(context.hash)} ${baselineNote}`,
        context.baseline
            ? `${verdictSentence(counts)} Informative only, nothing is gated.`
            : 'Informative only, nothing is gated.',
        ...context.notes.map(note => chalk.dim(`· ${note}`)),
        ...[...deltas].sort(byIdentity).flatMap(scenarioBlock),
        '',
        headerStyle('─'.repeat(RULE_WIDTH)),
        resultLine(counts, context.baseline !== null),
    ];

    if (missing.length > 0) {
        lines.push(
            chalk.yellow(
                `Not measured in this run: ${missing
                    .map(identity => `${identity.scenario} (${identity.target} ${identity.model})`)
                    .join(', ')}.`,
            ),
        );
    }

    if (context.compareUrl) {
        lines.push(`Full comparison: ${context.compareUrl}`);
    }

    if (context.runUrl) {
        lines.push(`CI artifacts: ${context.runUrl}`);
    }

    lines.push(
        chalk.dim('Flow reports: suite/e2e/test-results/<dir>/lighthouse-flow-report.html'),
        headerStyle('━'.repeat(RULE_WIDTH)),
    );

    return lines.join('\n');
};
