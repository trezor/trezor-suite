import {
    appendIndexRows,
    baselineKey,
    buildUploadBundle,
    indexKey,
    parseNdjson,
    publicUrl,
    renderNdjson,
    reportKey,
    slugifyRef,
    toBaselineDocument,
    toIndexRows,
} from './store';
import type { PerfStoreContext, ShardReport } from './store';
import type { PerformanceReport } from './types';

const context: PerfStoreContext = {
    branch: 'feat/native-e2e-perf-metrics',
    sha: 'ec599e58884046a48e76624c63a644663278b384',
    runId: '1842',
    runAttempt: '1',
};

const report: PerformanceReport = {
    meta: {
        platform: 'android',
        device: 'Pixel_7_API_34',
        appVersion: '25.9.1',
        commitHash: context.sha,
        generatedAt: '2026-09-18T07:30:00.000Z',
        sampleCount: 6,
    },
    screens: [
        {
            scenario: 'home',
            overLimit: false,
            unlimited: false,
            sampleCount: 3,
            metrics: [
                {
                    key: 'ttffMs',
                    label: 'Time to first frame',
                    unit: 'ms',
                    baseline: null,
                    current: 412,
                    limit: 800,
                    ratioToLimit: 0.515,
                    exceededLimit: false,
                },
                {
                    key: 'ttiMs',
                    label: 'Time to interactive',
                    unit: 'ms',
                    baseline: null,
                    current: 980,
                    limit: 1500,
                    ratioToLimit: 0.653,
                    exceededLimit: false,
                },
            ],
        },
        {
            scenario: 'accounts',
            overLimit: false,
            unlimited: false,
            sampleCount: 3,
            metrics: [
                {
                    key: 'ttffMs',
                    label: 'Time to first frame',
                    unit: 'ms',
                    baseline: null,
                    current: null,
                    limit: 800,
                    ratioToLimit: null,
                    exceededLimit: false,
                },
            ],
        },
    ],
    aggregate: { score: 88, overLimit: false },
};

const shardReport: ShardReport = { shard: '1', report };
const shardReports = [shardReport];

describe('slugifyRef', () => {
    it('flattens slashes and drops what a key cannot carry', () => {
        expect(slugifyRef('feat/native-e2e-perf-metrics')).toBe('feat__native-e2e-perf-metrics');
        expect(slugifyRef('release/2026-09 (rc1)')).toBe('release__2026-09-rc1');
        expect(slugifyRef('')).toBe('unknown');
    });
});

describe('keys', () => {
    it('keys a run by branch, commit and run attempt', () => {
        expect(reportKey(context, '1')).toBe(
            'runs/feat__native-e2e-perf-metrics/ec599e58884046a48e76624c63a644663278b384/1842-1/shard-1/report.json',
        );
    });

    it('keeps the shards of one run apart', () => {
        expect(reportKey(context, '2')).not.toBe(reportKey(context, '1'));
    });

    it('gives a pull request its own immutable index file', () => {
        expect(indexKey({ ...context, prNumber: '32587' })).toBe('index/pr/32587/1842-1.ndjson');
    });

    it('appends branch runs to one rolling index', () => {
        expect(indexKey({ ...context, branch: 'develop' })).toBe('index/develop/index.ndjson');
    });

    it('serves every key from the public origin', () => {
        expect(publicUrl(baselineKey('develop'))).toBe(
            'https://dev.suite.sldev.cz/e2e/perf/native/v1/baseline/develop/latest.json',
        );
    });
});

describe('toIndexRows', () => {
    it('reduces each screen to one row carrying its metrics and the blob it came from', () => {
        const rows = toIndexRows(shardReport, context);

        expect(rows).toHaveLength(2);
        expect(rows[0]).toMatchObject({
            screen: 'home',
            samples: 3,
            shard: '1',
            platform: 'android',
            device: 'Pixel_7_API_34',
            metrics: { ttffMs: 412, ttiMs: 980 },
            blob: reportKey(context, '1'),
        });
    });

    it('keeps an unmeasured metric as null rather than dropping it', () => {
        expect(toIndexRows(shardReport, context)[1]?.metrics).toEqual({ ttffMs: null });
    });
});

describe('ndjson', () => {
    it('round-trips rows', () => {
        const rows = toIndexRows(shardReport, context);

        expect(parseNdjson(renderNdjson(rows))).toEqual(rows);
    });

    it('renders nothing for no rows', () => {
        expect(renderNdjson([])).toBe('');
    });

    it('drops a line it cannot parse instead of failing', () => {
        expect(parseNdjson('{"screen":"home"}\nnot json\n\n')).toEqual([{ screen: 'home' }]);
    });
});

describe('appendIndexRows', () => {
    const existing = renderNdjson(toIndexRows(shardReport, context));

    it('adds the rows of a later run after the ones already there', () => {
        const later = toIndexRows(shardReport, { ...context, runId: '1843' });
        const lines = parseNdjson(appendIndexRows(existing, later));

        expect(lines).toHaveLength(4);
        expect(lines.map(line => line.run)).toEqual(['1842', '1842', '1843', '1843']);
    });

    it('replaces the lines of a re-run instead of doubling them', () => {
        const rerun = toIndexRows(shardReport, { ...context, runAttempt: '1' });
        const lines = parseNdjson(appendIndexRows(existing, rerun));

        expect(lines).toHaveLength(2);
    });

    it('starts a file that does not exist yet', () => {
        expect(parseNdjson(appendIndexRows('', toIndexRows(shardReport, context)))).toHaveLength(2);
    });

    it('keeps the lines of another shard of the same run', () => {
        const otherShard = toIndexRows({ shard: '2', report }, context);

        expect(parseNdjson(appendIndexRows(existing, otherShard))).toHaveLength(4);
    });
});

describe('toBaselineDocument', () => {
    it('reduces the run to the medians a later PR is compared against', () => {
        expect(toBaselineDocument(shardReports, { ...context, branch: 'develop' })).toEqual({
            updatedAt: '2026-09-18T07:30:00.000Z',
            branch: 'develop',
            sha: context.sha,
            run: '1842',
            screens: {
                home: { ttffMs: 412, ttiMs: 980 },
                accounts: { ttffMs: null },
            },
        });
    });
});

describe('buildUploadBundle', () => {
    it('writes the report and the index, and no baseline unless the run seals one', () => {
        expect(buildUploadBundle(shardReports, context).map(file => file.path)).toEqual([
            reportKey(context, '1'),
            indexKey(context),
        ]);
    });

    it('seals the baseline when asked', () => {
        const files = buildUploadBundle(shardReports, context, { sealBaseline: true });

        expect(files.map(file => file.path)).toContain(baselineKey(context.branch));
    });

    it('appends to the index a branch run already has', () => {
        const previous = renderNdjson(toIndexRows(shardReport, { ...context, runId: '1841' }));
        const files = buildUploadBundle(shardReports, context, { existingIndex: previous });
        const index = files.find(file => file.path === indexKey(context));

        expect(parseNdjson(index?.body ?? '')).toHaveLength(4);
    });

    it('writes one report object per shard', () => {
        const files = buildUploadBundle([shardReport, { shard: '2', report }], context);

        expect(files.map(file => file.path)).toEqual([
            reportKey(context, '1'),
            reportKey(context, '2'),
            indexKey(context),
        ]);
    });

    it('never appends for a pull request, whose file is its own', () => {
        const prContext = { ...context, prNumber: '32587' };
        const previous = renderNdjson(toIndexRows(shardReport, prContext));
        const files = buildUploadBundle(shardReports, prContext, { existingIndex: previous });
        const index = files.find(file => file.path === indexKey(prContext));

        expect(parseNdjson(index?.body ?? '')).toHaveLength(2);
    });
});
