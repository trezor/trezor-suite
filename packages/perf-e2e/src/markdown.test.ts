import { compareScenario } from './compare';
import {
    PERF_REPORT_MARKER,
    formatMarkdownReport,
    perfReportComment,
    perfReportSection,
} from './markdown';
import { buildJsonReport } from './report';
import { type PerfMetrics } from './types';

const metrics = (overrides: Partial<PerfMetrics> = {}): PerfMetrics => ({
    totalBlockingTimeMs: 0,
    longTaskCount: 0,
    longestTaskMs: 0,
    reactCommitCount: 0,
    interactionDurationMs: 0,
    ...overrides,
});

const measurement = ({
    key,
    runs = 1,
    current,
    baseline,
    limits,
}: {
    key: string;
    runs?: number;
    current: Partial<PerfMetrics>;
    baseline?: Parameters<typeof compareScenario>[2];
    limits?: Parameters<typeof compareScenario>[3];
}) => ({
    key,
    runs,
    report: buildJsonReport(compareScenario(key, metrics(current), baseline, limits)),
});

describe('perfReportComment', () => {
    it('starts a report with the marker the next job looks the comment up by', () => {
        const body = perfReportComment({ label: 'web / group 1', section: 'WEB' });

        expect(body).toContain(PERF_REPORT_MARKER);
        expect(body).toContain('## ⚡ Performance report');
        expect(body).toContain('<!-- PERF-E2E-SECTION:web / group 1:START -->\nWEB');
    });

    it('adds a second job to the report the first one started, keeping both', () => {
        const first = perfReportComment({ label: 'web / group 1', section: 'WEB' });
        const both = perfReportComment({
            existingBody: first,
            label: 'desktop / group 3',
            section: 'DESKTOP',
        });

        expect(both).toContain('WEB');
        expect(both).toContain('DESKTOP');
        expect(both.match(new RegExp(PERF_REPORT_MARKER, 'g'))).toHaveLength(1);
    });

    it('replaces only its own part when a job reports twice', () => {
        const first = perfReportComment({ label: 'web / group 1', section: 'WEB' });
        const both = perfReportComment({
            existingBody: first,
            label: 'desktop / group 3',
            section: 'DESKTOP',
        });
        const rerun = perfReportComment({
            existingBody: both,
            label: 'web / group 1',
            section: 'WEB AGAIN',
        });

        expect(rerun).toContain('WEB AGAIN');
        expect(rerun).not.toContain('\nWEB\n');
        expect(rerun).toContain('DESKTOP');
    });

    it('embeds the section block verbatim', () => {
        const body = perfReportComment({ label: 'web / group 1', section: 'WEB' });

        expect(body).toContain(perfReportSection({ label: 'web / group 1', section: 'WEB' }));
    });

    it('drops characters that would break out of the section marker', () => {
        const body = perfReportComment({ label: 'web <!-- -->', section: 'WEB' });

        expect(body).toContain('<!-- PERF-E2E-SECTION:web - -:START -->');
    });
});

describe('formatMarkdownReport', () => {
    it('names every measurement that went over its limit in the summary line', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch [T3W1]',
                current: { totalBlockingTimeMs: 900 },
                limits: { totalBlockingTimeMs: 700 },
            }),
            measurement({
                key: 'wallet-discovery [T3W1]',
                current: { totalBlockingTimeMs: 100 },
                limits: { totalBlockingTimeMs: 700 },
            }),
        ]);

        expect(report).toContain('🔴 **Over limit:** `account-switch [T3W1]`');
        expect(report).not.toContain('`wallet-discovery [T3W1]`, ');
        expect(report).toContain('the run is not failed');
    });

    it('reports a passing run as within limits', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch',
                current: { totalBlockingTimeMs: 100 },
                limits: { totalBlockingTimeMs: 700 },
            }),
        ]);

        expect(report).toContain('🟢 **Within limits.**');
        expect(report).not.toContain('Over limit');
    });

    it('unfolds a breached measurement and leaves a passing one folded', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'over',
                current: { totalBlockingTimeMs: 900 },
                limits: { totalBlockingTimeMs: 700 },
            }),
            measurement({
                key: 'under',
                current: { totalBlockingTimeMs: 100 },
                limits: { totalBlockingTimeMs: 700 },
            }),
        ]);

        expect(report).toContain('<details open>\n<summary><code>over</code> — 🔴 over limit');
        expect(report).toContain('<details>\n<summary><code>under</code> — 🟢 within limits');
    });

    it('marks a scenario with no limits as measured against nothing', () => {
        const report = formatMarkdownReport([
            measurement({ key: 'unlimited', current: { totalBlockingTimeMs: 100 } }),
        ]);

        expect(report).toContain('⚪ no limits set');
    });

    it('writes one table row per metric, flagging the ones over their limit', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch',
                current: { totalBlockingTimeMs: 900, longTaskCount: 2 },
                limits: { totalBlockingTimeMs: 700 },
            }),
        ]);

        expect(report).toContain('| Total Blocking Time ⚠️ | 900 ms | 700 ms | 129% | n/a | n/a |');
        expect(report).toContain('| Long tasks (>50ms) | 2 | n/a | n/a | n/a | n/a |');
    });

    it('emphasises the share of the baseline only when the run came in under it', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch',
                current: { totalBlockingTimeMs: 500, longTaskCount: 12 },
                baseline: { totalBlockingTimeMs: 1000, longTaskCount: 10 },
            }),
        ]);

        expect(report).toContain(
            '| Total Blocking Time | 500 ms | n/a | n/a | 1000 ms | **50%** |',
        );
        expect(report).toContain('| Long tasks (>50ms) | 12 | n/a | n/a | 10 | 120% |');
    });

    it('recommends lowering a baseline the run came in clearly under', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch',
                current: { totalBlockingTimeMs: 500 },
                baseline: { totalBlockingTimeMs: 1000 },
            }),
        ]);

        expect(report).toContain(
            '🔵 **Under baseline:** `account-switch` (Total Blocking Time −50%)',
        );
        expect(report).toContain('the baseline is stale');
    });

    it('says nothing about a baseline the run only just came in under', () => {
        const report = formatMarkdownReport([
            measurement({
                key: 'account-switch',
                current: { totalBlockingTimeMs: 950 },
                baseline: { totalBlockingTimeMs: 1000 },
            }),
        ]);

        expect(report).not.toContain('Under baseline');
    });

    it('escapes a pipe and the backslash that would cancel that escape', () => {
        const report = formatMarkdownReport([
            measurement({ key: 'a|b', current: {} }),
            measurement({ key: 'c\\|d', current: {} }),
        ]);

        expect(report).toContain('<code>a\\|b</code>');
        expect(report).toContain('<code>c\\\\\\|d</code>');
    });

    it('says how many samples the medians came from', () => {
        const single = formatMarkdownReport([
            measurement({ key: 'account-switch', runs: 1, current: {} }),
        ]);
        const retried = formatMarkdownReport([
            measurement({ key: 'account-switch', runs: 3, current: {} }),
        ]);

        expect(single).toContain('median of 1 run<');
        expect(retried).toContain('median of 3 runs<');
    });

    it('links the run and labels the job the numbers come from', () => {
        const report = formatMarkdownReport([measurement({ key: 'account-switch', current: {} })], {
            label: 'desktop / group 3',
            runUrl: 'https://github.com/o/r/actions/runs/1',
        });

        expect(report).toContain('### desktop / group 3');
        expect(report).toContain('Measured in [this run](https://github.com/o/r/actions/runs/1).');
    });

    it('offers the budgets paste when the reporter supplies one', () => {
        const report = formatMarkdownReport([measurement({ key: 'account-switch', current: {} })], {
            budgetsSnippet: {
                path: 'suite/e2e/performance/budgets.ts',
                contents: 'export const X = 1;',
            },
        });

        expect(report).toContain("cat > suite/e2e/performance/budgets.ts <<'TS'");
        expect(report).toContain('export const X = 1;');
    });

    it('leaves the paste out when there is none, so the comment stays short', () => {
        const report = formatMarkdownReport([measurement({ key: 'account-switch', current: {} })]);

        expect(report).not.toContain('Record this run');
    });
});
