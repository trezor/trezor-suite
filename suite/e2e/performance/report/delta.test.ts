import { type Baseline } from './baseline';
import { type Lhr, type PerfSample } from './collect';
import { computeDeltas, missingScenarios, sampleAuditValue } from './delta';
import { syntheticUrl } from './identity';

const lhrWithAudits = (values: Record<string, number>): Lhr =>
    ({
        audits: Object.fromEntries(
            Object.entries(values).map(([id, numericValue]) => [id, { id, numericValue }]),
        ),
    }) as unknown as Lhr;

const sample = (overrides: Partial<PerfSample> = {}): PerfSample => ({
    target: 'desktop',
    model: 'T3W1',
    scenario: 'account-switch',
    retry: 0,
    lhr: null,
    perfMetrics: null,
    ...overrides,
});

const baselineWith = (entries: Record<string, Record<string, number>>): Baseline => ({
    build: {
        id: 'base-build',
        projectId: 'p',
        branch: 'develop',
        hash: 'f'.repeat(40),
        lifecycle: 'sealed',
        runAt: '2026-08-26T00:00:00.000Z',
    },
    medians: new Map(
        Object.entries(entries).map(([url, audits]) => [url, new Map(Object.entries(audits))]),
    ),
});

const url = syntheticUrl({ target: 'desktop', model: 'T3W1', scenario: 'account-switch' });

const metricRow = (deltas: ReturnType<typeof computeDeltas>, auditId: string) =>
    deltas[0]?.metrics.find(row => row.metric.auditId === auditId);

describe('sampleAuditValue', () => {
    it('reads a Lighthouse audit from the LHR', () => {
        const value = sampleAuditValue(
            sample({ lhr: lhrWithAudits({ 'total-blocking-time': 672 }) }),
            'total-blocking-time',
        );

        expect(value).toBe(672);
    });

    // The trezor-* numbers exist even when the timespan died — they come from perf.measure.
    it('falls back to the in-page metrics for a trezor audit when the LHR is missing', () => {
        const value = sampleAuditValue(
            sample({
                perfMetrics: {
                    totalBlockingTimeMs: 100,
                    longTaskCount: 2,
                    longestTaskMs: 80,
                    reactCommitCount: 35,
                    interactionDurationMs: 700,
                },
            }),
            'trezor-react-commit-count',
        );

        expect(value).toBe(35);
    });

    it('yields null when neither side has the number', () => {
        expect(sampleAuditValue(sample(), 'total-blocking-time')).toBeNull();
    });
});

describe('computeDeltas', () => {
    it('flags a regression only when both floors trip', () => {
        // TBT floors: 15% relative, 100 ms absolute (base 500 → +150 ms = +30% trips both).
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 650 }) })],
            baselineWith({ [url]: { 'total-blocking-time': 500 } }),
        );

        expect(metricRow(deltas, 'total-blocking-time')?.verdict).toBe('regression');
    });

    it('stays quiet when the absolute floor is not reached', () => {
        // +90 ms is 18% of 500 — over the relative floor, under the 100 ms absolute one.
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 590 }) })],
            baselineWith({ [url]: { 'total-blocking-time': 500 } }),
        );

        expect(metricRow(deltas, 'total-blocking-time')?.verdict).toBeNull();
    });

    it('stays quiet when the relative floor is not reached', () => {
        // +150 ms clears the absolute floor but is 7.5% of 2000 — big numbers may drift.
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 2150 }) })],
            baselineWith({ [url]: { 'total-blocking-time': 2000 } }),
        );

        expect(metricRow(deltas, 'total-blocking-time')?.verdict).toBeNull();
    });

    it('flags an improvement when a number drops past both floors', () => {
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 600 }) })],
            baselineWith({ [url]: { 'total-blocking-time': 800 } }),
        );

        expect(metricRow(deltas, 'total-blocking-time')?.verdict).toBe('improvement');
    });

    // A zero baseline has no meaningful percentage — any change from zero is infinitely many
    // percent, so the absolute floor must judge alone rather than muting the metric forever.
    it('flags a regression from a zero baseline once the absolute floor trips', () => {
        const deltas = computeDeltas(
            [
                sample({
                    perfMetrics: {
                        totalBlockingTimeMs: null,
                        longTaskCount: 10,
                        longestTaskMs: null,
                        reactCommitCount: null,
                        interactionDurationMs: null,
                    },
                }),
            ],
            baselineWith({ [url]: { 'trezor-long-task-count': 0 } }),
        );

        expect(metricRow(deltas, 'trezor-long-task-count')?.verdict).toBe('regression');
    });

    // CLS has no meaningful relative floor: its baseline is often ~0, where percentages explode.
    it('judges CLS by the absolute floor alone', () => {
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'cumulative-layout-shift': 0.08 }) })],
            baselineWith({ [url]: { 'cumulative-layout-shift': 0.05 } }),
        );

        expect(metricRow(deltas, 'cumulative-layout-shift')?.verdict).toBe('regression');
    });

    it('takes the median over retries on the current side', () => {
        const deltas = computeDeltas(
            [
                sample({ lhr: lhrWithAudits({ 'total-blocking-time': 100 }) }),
                sample({ retry: 1, lhr: lhrWithAudits({ 'total-blocking-time': 300 }) }),
            ],
            null,
        );

        expect(deltas).toHaveLength(1);
        expect(deltas[0]?.runs).toBe(2);
        expect(metricRow(deltas, 'total-blocking-time')?.current).toBe(200);
    });

    it('renders absolute values without verdicts when there is no baseline', () => {
        const deltas = computeDeltas(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 650 }) })],
            null,
        );

        const row = metricRow(deltas, 'total-blocking-time');
        expect(row?.current).toBe(650);
        expect(row?.baseline).toBeNull();
        expect(row?.verdict).toBeNull();
    });
});

describe('missingScenarios', () => {
    it('lists a scenario the baseline covers but this run dropped', () => {
        const droppedUrl = syntheticUrl({
            target: 'desktop',
            model: 'T3W1',
            scenario: 'wallet-discovery',
        });
        const missing = missingScenarios(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 650 }) })],
            baselineWith({
                [url]: { 'total-blocking-time': 500 },
                [droppedUrl]: { 'total-blocking-time': 400 },
            }),
        );

        expect(missing).toEqual([
            { target: 'desktop', model: 'T3W1', scenario: 'wallet-discovery' },
        ]);
    });

    // The nightly baseline also carries models and targets PRs deliberately never run (T3T1
    // accrues nightly only) — those must not read as shard failures on every PR.
    it('ignores (target, model) pairs this run never measures', () => {
        const nightlyOnlyUrl = syntheticUrl({
            target: 'web',
            model: 'T3T1',
            scenario: 'account-switch',
        });
        const missing = missingScenarios(
            [sample({ lhr: lhrWithAudits({ 'total-blocking-time': 650 }) })],
            baselineWith({
                [url]: { 'total-blocking-time': 500 },
                [nightlyOnlyUrl]: { 'total-blocking-time': 400 },
            }),
        );

        expect(missing).toEqual([]);
    });

    it('lists nothing without a baseline', () => {
        expect(missingScenarios([sample()], null)).toEqual([]);
    });
});
