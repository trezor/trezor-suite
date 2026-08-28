import chalk from 'chalk';

import { type MetricDelta, type ScenarioDelta } from './delta';
import { type ReportContext } from './format';
import { REPORT_METRICS, type ReportMetric, syntheticUrl } from './identity';
import { renderTerminalReport } from './terminal';

// The layout is what is under test, not the colours: level 0 keeps chalk out of the assertions the
// same way a piped run would.
chalk.level = 0;

const metricBy = (auditId: string): ReportMetric => {
    const metric = REPORT_METRICS.find(candidate => candidate.auditId === auditId);
    if (!metric) {
        throw new Error(`unknown metric ${auditId}`);
    }

    return metric;
};

const row = (
    auditId: string,
    values: Pick<MetricDelta, 'baseline' | 'current' | 'verdict'>,
): MetricDelta => ({ metric: metricBy(auditId), ...values });

const scenarioDelta = (
    scenario: string,
    metrics: MetricDelta[],
    overrides: Partial<ScenarioDelta['identity']> = {},
): ScenarioDelta => {
    const identity = { target: 'desktop', model: 'T3W1', scenario, ...overrides };

    return { identity, url: syntheticUrl(identity), runs: 1, metrics };
};

const context = (overrides: Partial<ReportContext> = {}): ReportContext => ({
    branch: 'feat/x',
    hash: '1a2b3c4d'.repeat(5),
    baseBranch: 'develop',
    baseline: {
        hash: '9f8e7d6c'.repeat(5),
        runAt: new Date(Date.now() - 14 * 3_600_000).toISOString(),
    },
    compareUrl: 'https://perf.example/compare',
    runUrl: 'https://github.com/trezor/trezor-suite/actions/runs/1',
    notes: [],
    ...overrides,
});

describe('renderTerminalReport', () => {
    it('renders the header, the verdict counts and one row per measured metric', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', {
                        baseline: 894,
                        current: 1102,
                        verdict: 'regression',
                    }),
                    row('bootup-time', { baseline: 1000, current: 850, verdict: 'improvement' }),
                    row('trezor-interaction-duration', {
                        baseline: 6894,
                        current: 7010,
                        verdict: null,
                    }),
                ]),
            ],
            [],
            context(),
        );

        expect(report).toContain('PERFORMANCE DELTA REPORT');
        expect(report).toContain('feat/x @ 1a2b3c4 vs develop @ 9f8e7d6 (baseline, 14 h old)');
        expect(report).toContain('1 regression, 1 improvement, 1 within noise.');
        expect(report).toContain('Desktop · T3W1 · wallet-discovery  (median of 1 run)');
        expect(report).toContain('metric                  baseline     current      delta');
        expect(report).toContain(
            'Total Blocking Time     894 ms       1 102 ms     +208 ms (+23%) !!',
        );
        expect(report).toContain(
            'Script bootup           1 000 ms     850 ms       −150 ms (−15%) ++',
        );
        expect(report).toContain('Result: 1 regression flagged');
        expect(report).toContain('Full comparison: https://perf.example/compare');
    });

    it('has no markdown in it', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
            ],
            [],
            context(),
        );

        expect(report).not.toContain('|');
        expect(report).not.toContain('**');
        expect(report).not.toContain('###');
    });

    it('reports absolute values without a baseline', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: null, current: 1102, verdict: null }),
                ]),
            ],
            [],
            context({ baseline: null, compareUrl: null }),
        );

        expect(report).toContain('no develop baseline reachable, absolute values only');
        expect(report).toContain('Result: absolute values only');
        expect(report).toContain('Total Blocking Time     —            1 102 ms     —');
        expect(report).not.toContain('Full comparison');
    });

    it('marks an unchanged metric instead of printing a zero delta', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('trezor-react-commit-count', { baseline: 42, current: 42, verdict: null }),
                ]),
            ],
            [],
            context(),
        );

        expect(report).toContain('React commits           42           42           ±0');
        expect(report).toContain('Result: no regression past the noise floors.');
    });

    it('omits a metric neither side measured', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                    row('total-byte-weight', { baseline: null, current: null, verdict: null }),
                ]),
            ],
            [],
            context(),
        );

        expect(report).toContain('Total Blocking Time');
        expect(report).not.toContain('Byte weight');
    });

    it('blocks each target and model separately, in a stable order', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta(
                    'wallet-discovery',
                    [row('total-blocking-time', { baseline: 700, current: 705, verdict: null })],
                    { target: 'web' },
                ),
                scenarioDelta(
                    'account-switch',
                    [row('total-blocking-time', { baseline: 894, current: 902, verdict: null })],
                    { model: 'T3T1' },
                ),
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
            ],
            [],
            context(),
        );

        const blocks = report
            .split('\n')
            .filter(line => line.includes(' · '))
            .map(line => line.split('  (')[0]);

        expect(blocks).toEqual([
            'Desktop · T3T1 · account-switch',
            'Desktop · T3W1 · wallet-discovery',
            'Web · T3W1 · wallet-discovery',
        ]);
    });

    it('prints the notes and the scenarios this run did not measure', () => {
        const report = renderTerminalReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
            ],
            [{ target: 'web', model: 'T3W1', scenario: 'account-switch' }],
            context({ notes: ['upload skipped: no build token'] }),
        );

        expect(report).toContain('· upload skipped: no build token');
        expect(report).toContain('Not measured in this run: account-switch (web T3W1)');
    });

    // The markdown collapses past the PR body's character cap. A scrollback has no cap, so every
    // row of every scenario has to survive here.
    it('keeps every row however wide the run was', () => {
        const scenarios = Array.from({ length: 200 }, (_, index) =>
            scenarioDelta(`scenario-${index}`, [
                row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                row('bootup-time', { baseline: 900, current: 910, verdict: null }),
            ]),
        );

        const report = renderTerminalReport(scenarios, [], context());

        expect(report.split('\n').filter(line => line.includes('Script bootup'))).toHaveLength(200);
        expect(report).not.toContain('collapsed');
    });
});
