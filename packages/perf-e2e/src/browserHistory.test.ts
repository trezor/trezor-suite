import {
    BROWSER_METRIC_PREFIX,
    buildHistoryFile,
    historyToPerfRun,
    mergeHistories,
    resolveSurface,
} from './browserHistory';
import type { PerfHistoryFile } from './browserHistory';
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
