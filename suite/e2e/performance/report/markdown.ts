import { MetricDelta, ScenarioDelta, Verdict } from './delta';
import {
    ReportContext,
    countVerdicts,
    formatAge,
    formatPercent,
    formatValue,
    short,
    targetHeading,
    verdictSentence,
} from './format';
import { REPORT_METRICS, SampleIdentity, sanitizeScenario } from './identity';

/**
 * Renders the deltas as the PR-description section (and the job's step summary). Layout matches the
 * plan's mock: one table per target, metrics as rows, scenarios as columns, only the repro block
 * collapsed. The terminal layout of the same data lives in terminal.ts.
 */

/**
 * The PR body tops out at 65 536 chars and is shared with other bots; past this cap the tables
 * collapse to their significant rows.
 */
const MAX_REPORT_CHARS = 20_000;

const VERDICT_EMOJI: Record<Verdict, string> = { regression: ' 🔴', improvement: ' 🟢' };

const formatCell = ({ metric, baseline, current, verdict }: MetricDelta): string => {
    if (current === null) {
        return baseline === null ? '—' : `— (was ${formatValue(baseline, metric.unit)})`;
    }
    if (baseline === null) {
        return formatValue(current, metric.unit);
    }

    const percent = formatPercent(baseline, current);

    return `${formatValue(baseline, metric.unit)} → ${formatValue(current, metric.unit)}${percent ? ` (${percent})` : ''}${verdict ? VERDICT_EMOJI[verdict] : ''}`;
};

const scenarioLabel = ({ model, scenario }: SampleIdentity, models: Set<string>) =>
    models.size > 1 ? `${sanitizeScenario(scenario)} [${model}]` : sanitizeScenario(scenario);

const renderTargetTable = (deltas: ScenarioDelta[], significantOnly: boolean): string[] => {
    const models = new Set(deltas.map(delta => delta.identity.model));
    const columns = deltas.map(delta => scenarioLabel(delta.identity, models));

    // Rows in the registry's order regardless of which scenario contributed them first; a metric
    // none of the scenarios measured is left out, and in the collapsed variant so is every row
    // without a verdict.
    const presentAuditIds = new Set(
        deltas.flatMap(delta => delta.metrics.map(row => row.metric.auditId)),
    );
    const rows = REPORT_METRICS.filter(metric => presentAuditIds.has(metric.auditId))
        .map(metric => {
            const cells = deltas.map(delta =>
                delta.metrics.find(row => row.metric.auditId === metric.auditId),
            );
            const significant = cells.some(cell => cell?.verdict);

            return { label: metric.label, cells, significant };
        })
        .filter(row => !significantOnly || row.significant);

    if (rows.length === 0) {
        return ['_All metrics within noise._', ''];
    }

    return [
        `| Metric | ${columns.join(' | ')} |`,
        `|---|${columns.map(() => '---').join('|')}|`,
        ...rows.map(
            row =>
                `| ${row.label} | ${row.cells.map(cell => (cell ? formatCell(cell) : '—')).join(' | ')} |`,
        ),
        '',
    ];
};

const REPRO_BLOCK = [
    '<details><summary>Reproduce & debug locally</summary>',
    '',
    '`yarn workspace @trezor/suite-e2e test:e2e:desktop:lighthouse` (or `…:web:lighthouse`), then',
    '`yarn workspace @trezor/suite-e2e perf:report` · flow report at',
    '`suite/e2e/test-results/<dir>/lighthouse-flow-report.html` · trace via',
    '`npx playwright show-trace <dir>/trace.zip` · plumbing in `suite/e2e/performance/`,',
    'docs in `suite/e2e/docs/e2e-lighthouse.md`',
    '',
    '</details>',
];

type TableDetail = 'full' | 'significant-only' | 'none';

const DETAIL_NOTES: Record<TableDetail, string[]> = {
    full: [],
    'significant-only': ['', '_Tables collapsed to significant rows to fit the PR body._'],
    none: [
        '',
        '_Too many significant changes to fit the PR body — see the server comparison for the tables._',
    ],
};

const render = (
    deltas: ScenarioDelta[],
    missing: SampleIdentity[],
    context: ReportContext,
    detail: TableDetail,
): string => {
    const counts = countVerdicts(deltas);
    const baselineNote = context.baseline
        ? `vs \`${context.baseBranch}\` @ \`${short(context.baseline.hash)}\` (nightly baseline, ${formatAge(context.baseline.runAt)})`
        : `— no \`${context.baseBranch}\` baseline reachable, absolute values only`;
    const models = [...new Set(deltas.map(delta => delta.identity.model))].sort();
    const modelLabel = models.length === 1 ? 'model' : 'models';
    const modelsNote = models.length > 0 ? ` — ${modelLabel} ${models.join(', ')}` : '';

    const lines: string[] = [
        '### ⚡ Performance report',
        '',
        `\`${context.branch}\` @ \`${short(context.hash)}\` ${baselineNote}${modelsNote}.`,
        '',
        context.baseline
            ? `**${verdictSentence(counts)}** Informative only, nothing is gated.`
            : '**Informative only, nothing is gated.**',
        ...DETAIL_NOTES[detail],
        ...context.notes.map(note => `> ${note}`),
        '',
    ];

    if (detail !== 'none') {
        const targets = [...new Set(deltas.map(delta => delta.identity.target))].sort();
        for (const target of targets) {
            lines.push(
                `**${targetHeading(target)}**`,
                '',
                ...renderTargetTable(
                    deltas.filter(delta => delta.identity.target === target),
                    detail === 'significant-only',
                ),
            );
        }
    }

    if (missing.length > 0) {
        lines.push(
            `⚠️ Not measured in this run: ${missing
                .map(identity => `\`${identity.scenario}\` (${identity.target} ${identity.model})`)
                .join(', ')}.`,
            '',
        );
    }

    const links = [
        ...(context.compareUrl
            ? [`[Full comparison on the Lighthouse server](${context.compareUrl})`]
            : []),
        ...(context.runUrl ? [`[CI artifacts & flow reports](${context.runUrl})`] : []),
    ];
    if (links.length > 0) {
        lines.push(links.join(' · '), '');
    }

    lines.push(...REPRO_BLOCK);

    return lines.join('\n');
};

export const renderReport = (
    deltas: ScenarioDelta[],
    missing: SampleIdentity[],
    context: ReportContext,
): string => {
    // Ever-coarser fallbacks: full tables, significant rows only, no tables at all. The last one
    // always fits — a run wide enough to overflow even its significant rows is best read on the
    // server anyway.
    for (const detail of ['full', 'significant-only'] as const) {
        const rendered = render(deltas, missing, context, detail);
        if (rendered.length <= MAX_REPORT_CHARS) {
            return rendered;
        }
    }

    return render(deltas, missing, context, 'none');
};
