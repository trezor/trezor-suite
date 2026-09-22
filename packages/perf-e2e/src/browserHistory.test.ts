import {
    BROWSER_METRIC_PREFIX,
    buildHistoryFile,
    historyToPerfRun,
    mergeHistories,
    resolveSurface,
} from './browserHistory';
import type { PerfHistoryFile } from './browserHistory';
import { buildFlowDocument } from './lighthouseFlow';
import type { FlowDocument } from './lighthouseFlow';
import type { PerfRunIdentity } from './publishRuns';

const identity: PerfRunIdentity = {
    branch: 'feat/thing',
    sha: 'abc1234',
    runId: '99',
    runAttempt: '1',
};

const history: PerfHistoryFile = {
    generatedAt: '2026-09-19T08:00:00.000Z',
    surface: 'web',
    measurements: [
        {
            scenario: 'wallet-discovery',
            variant: 'T3W1',
            runs: 3,
            metrics: { totalBlockingTimeMs: 611, longTaskCount: 22, interactionDurationMs: null },
        },
    ],
};

describe('resolveSurface', () => {
    it('accepts only the surfaces this pipeline measures', () => {
        expect(resolveSurface('web')).toBe('web');
        expect(resolveSurface('desktop')).toBe('desktop');
        expect(resolveSurface('android')).toBeNull();
        expect(resolveSurface(undefined)).toBeNull();
        expect(resolveSurface('')).toBeNull();
    });
});

describe('buildHistoryFile', () => {
    it('stamps the document and copies the measurements', () => {
        const file = buildHistoryFile('desktop', history.measurements, '2026-09-19T09:00:00.000Z');

        expect(file).toEqual({
            generatedAt: '2026-09-19T09:00:00.000Z',
            surface: 'desktop',
            measurements: history.measurements,
        });
    });

    it('does not alias the caller’s array', () => {
        const measurements = [...history.measurements];
        const file = buildHistoryFile('web', measurements);

        measurements.pop();

        expect(file.measurements).toHaveLength(1);
    });
});

describe('historyToPerfRun', () => {
    it('namespaces the in-page metrics so they cannot be compared with Lighthouse audits', () => {
        const run = historyToPerfRun('3', history, identity);

        expect(run?.measurements[0]?.metrics).toEqual({
            [`${BROWSER_METRIC_PREFIX}:totalBlockingTimeMs`]: 611,
            [`${BROWSER_METRIC_PREFIX}:longTaskCount`]: 22,
            [`${BROWSER_METRIC_PREFIX}:interactionDurationMs`]: null,
        });
    });

    it('keeps the device model as the variant, so two models stay two measurements', () => {
        const run = historyToPerfRun('3', history, identity);

        expect(run?.measurements[0]).toMatchObject({
            scenario: 'wallet-discovery',
            variant: 'T3W1',
            samples: 3,
            artifact: 'history',
        });
    });

    it('carries the surface and shard into the context', () => {
        expect(historyToPerfRun('3', history, identity)?.context).toMatchObject({
            surface: 'web',
            shard: '3',
            branch: 'feat/thing',
            generatedAt: '2026-09-19T08:00:00.000Z',
        });
    });

    it('stores the document itself as the artifact to drill into', () => {
        const run = historyToPerfRun('3', history, identity);

        expect(run?.artifacts).toEqual([
            {
                kind: 'browser-report',
                name: 'history',
                body: `${JSON.stringify(history, null, 2)}\n`,
            },
        ]);
    });

    it('contributes no run when the shard measured nothing', () => {
        expect(historyToPerfRun('3', { ...history, measurements: [] }, identity)).toBeNull();
    });
});

describe('mergeHistories', () => {
    const second: PerfHistoryFile = {
        generatedAt: '2026-09-19T09:00:00.000Z',
        surface: 'web',
        measurements: [
            {
                scenario: 'account-switch',
                variant: 'T3W1',
                runs: 2,
                metrics: { totalBlockingTimeMs: 242 },
            },
        ],
    };

    it('keeps every measurement a shard reported across its batches', () => {
        const merged = mergeHistories([history, second]);

        expect(merged?.measurements.map(measurement => measurement.scenario)).toEqual([
            'wallet-discovery',
            'account-switch',
        ]);
    });

    it('stamps the merged document with the last batch to finish', () => {
        expect(mergeHistories([history, second])?.generatedAt).toBe('2026-09-19T09:00:00.000Z');
        expect(mergeHistories([second, history])?.generatedAt).toBe('2026-09-19T09:00:00.000Z');
    });

    it('lets a re-measured scenario keep the numbers that ran last', () => {
        const remeasured: PerfHistoryFile = {
            ...second,
            measurements: [
                {
                    scenario: 'wallet-discovery',
                    variant: 'T3W1',
                    runs: 1,
                    metrics: { totalBlockingTimeMs: 999 },
                },
            ],
        };

        expect(mergeHistories([history, remeasured])?.measurements).toEqual(
            remeasured.measurements,
        );
    });

    it('keeps two device models of one scenario apart', () => {
        const otherModel: PerfHistoryFile = {
            ...second,
            measurements: [{ ...history.measurements[0]!, variant: 'T3T1' }],
        };

        expect(mergeHistories([history, otherModel])?.measurements).toHaveLength(2);
    });

    it('is null when the shard left nothing', () => {
        expect(mergeHistories([])).toBeNull();
    });
});

describe('historyToPerfRun with Lighthouse flows', () => {
    const flow = (overrides: Partial<Parameters<typeof buildFlowDocument>[0]> = {}): FlowDocument =>
        buildFlowDocument({
            surface: 'web',
            model: 'T3W1',
            title: 'wallet discovery',
            retry: 0,
            generatedAt: '2026-09-22T08:00:00.000Z',
            flow: {
                steps: [
                    {
                        name: 'wallet-discovery',
                        lhr: { audits: { 'total-blocking-time': { numericValue: 812 } } },
                    },
                ],
            },
            ...overrides,
        });

    it('changes nothing when a run was not profiled', () => {
        expect(historyToPerfRun('3', history, identity, [])).toEqual(
            historyToPerfRun('3', history, identity),
        );
    });

    it('carries both instruments in one row, and points it at the flow result', () => {
        const run = historyToPerfRun('3', history, identity, [flow()]);
        const [measurement] = run?.measurements ?? [];

        expect(measurement?.metrics).toMatchObject({
            'browser:totalBlockingTimeMs': 611,
            'lh:total-blocking-time': 812,
        });
        expect(measurement?.artifact).toBe('flow-wallet-discovery-T3W1-0');
    });

    it('stores the stripped flow beside the history document', () => {
        const run = historyToPerfRun('3', history, identity, [flow()]);

        expect(run?.artifacts.map(artifact => [artifact.kind, artifact.name])).toEqual([
            ['browser-report', 'history'],
            ['flow-result', 'flow-wallet-discovery-T3W1-0'],
        ]);
    });

    it('does not let a timespan of another device model claim this row', () => {
        const run = historyToPerfRun('3', history, identity, [flow({ model: 'T3T1' })]);
        const [measurement] = run?.measurements ?? [];

        expect(measurement?.artifact).toBe('history');
        expect(measurement?.metrics['lh:total-blocking-time']).toBeUndefined();
    });

    it('keeps a timespan we produced no median for, rather than dropping it', () => {
        const unmeasured = flow({
            flow: { steps: [{ name: 'send-flow', lhr: { audits: {} } }] },
        });
        const run = historyToPerfRun('3', history, identity, [unmeasured]);

        expect(run?.measurements.map(m => m.scenario)).toEqual(['wallet-discovery', 'send-flow']);
        expect(run?.measurements.at(-1)).toMatchObject({ variant: 'T3W1', samples: 1 });
    });

    it('publishes a profiled shard even when our instrumentation measured nothing', () => {
        const run = historyToPerfRun('3', { ...history, measurements: [] }, identity, [flow()]);

        expect(run?.measurements).toHaveLength(1);
        expect(run?.artifacts.map(artifact => artifact.kind)).toEqual(['flow-result']);
    });

    it('lets the last retry of a test win', () => {
        const run = historyToPerfRun('3', history, identity, [
            flow({ retry: 0 }),
            flow({
                retry: 1,
                flow: {
                    steps: [
                        {
                            name: 'wallet-discovery',
                            lhr: { audits: { 'total-blocking-time': { numericValue: 999 } } },
                        },
                    ],
                },
            }),
        ]);

        expect(run?.measurements[0]?.metrics['lh:total-blocking-time']).toBe(999);
        expect(run?.measurements[0]?.artifact).toBe('flow-wallet-discovery-T3W1-1');
    });
});
