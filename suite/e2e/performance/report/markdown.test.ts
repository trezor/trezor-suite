import { type MetricDelta, type ScenarioDelta } from './delta';
import { type ReportContext } from './format';
import { REPORT_METRICS, type ReportMetric, syntheticUrl } from './identity';
import { renderReport } from './markdown';

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

describe('renderReport', () => {
    it('renders the header, verdict counts and a delta cell', () => {
        const report = renderReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', {
                        baseline: 894,
                        current: 1102,
                        verdict: 'regression',
                    }),
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

        expect(report).toContain('### ⚡ Performance report');
        expect(report).toContain('`feat/x` @ `1a2b3c4`');
        expect(report).toContain('nightly baseline, 14 h old');
        expect(report).toContain('**1 regression, 0 improvements, 1 within noise.**');
        expect(report).toContain('894 ms → 1 102 ms (+23%) 🔴');
        expect(report).toContain('**Desktop**');
        expect(report).toContain('[Full comparison on the Lighthouse server]');
    });

    it('renders absolute values without a baseline', () => {
        const report = renderReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: null, current: 1102, verdict: null }),
                ]),
            ],
            [],
            context({ baseline: null, compareUrl: null }),
        );

        expect(report).toContain('absolute values only');
        expect(report).toContain('| 1 102 ms |');
        expect(report).not.toContain('→');
    });

    it('lists scenarios the baseline has but this run did not measure', () => {
        const report = renderReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
            ],
            [{ target: 'web', model: 'T3W1', scenario: 'account-switch' }],
            context(),
        );

        expect(report).toContain('Not measured in this run: `account-switch` (web T3W1)');
    });

    it('splits targets into separate tables', () => {
        const report = renderReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
                scenarioDelta(
                    'wallet-discovery',
                    [row('total-blocking-time', { baseline: 700, current: 705, verdict: null })],
                    { target: 'web' },
                ),
            ],
            [],
            context(),
        );

        expect(report).toContain('**Desktop**');
        expect(report).toContain('**Web**');
    });

    // The PR body tops out at 64 KB shared with other bots; past the cap only rows with a verdict
    // survive.
    it('collapses to significant rows when the full render outgrows the cap', () => {
        const scenarios = Array.from({ length: 200 }, (_, index) =>
            scenarioDelta(`scenario-with-a-rather-long-name-${index}`, [
                row('total-blocking-time', {
                    baseline: 894,
                    current: index === 0 ? 1500 : 902,
                    verdict: index === 0 ? 'regression' : null,
                }),
                row('bootup-time', { baseline: 900, current: 910, verdict: null }),
                row('trezor-react-commit-count', { baseline: 200, current: 201, verdict: null }),
            ]),
        );

        const report = renderReport(scenarios, [], context());

        expect(report.length).toBeLessThanOrEqual(20_000);
        expect(report).toContain('collapsed to significant rows');
        expect(report).toContain('Total Blocking Time');
        expect(report).not.toContain('| Script bootup |');
    });

    // When even the significant rows overflow, the tables go entirely — header, counts and links
    // always fit.
    it('drops the tables when even the collapsed render outgrows the cap', () => {
        const scenarios = Array.from({ length: 500 }, (_, index) =>
            scenarioDelta(`scenario-with-a-rather-long-name-${index}`, [
                row('total-blocking-time', { baseline: 894, current: 1500, verdict: 'regression' }),
            ]),
        );

        const report = renderReport(scenarios, [], context());

        expect(report.length).toBeLessThanOrEqual(20_000);
        expect(report).toContain('Too many significant changes');
        expect(report).not.toContain('| Metric |');
        expect(report).toContain('[Full comparison on the Lighthouse server]');
    });

    it('names the measured model in the header', () => {
        const report = renderReport(
            [
                scenarioDelta('wallet-discovery', [
                    row('total-blocking-time', { baseline: 894, current: 902, verdict: null }),
                ]),
            ],
            [],
            context(),
        );

        expect(report).toContain('— model T3W1.');
    });
});
