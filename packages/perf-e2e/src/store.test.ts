import type { PerfRun, PerfRunContext } from './store';
import {
    appendIndexRows,
    artifactKey,
    baselineKey,
    buildUploadBundle,
    indexKey,
    measurementLabel,
    parseNdjson,
    publicUrl,
    renderNdjson,
    slugify,
    toBaselineDocument,
    toIndexRows,
} from './store';

const context: PerfRunContext = {
    surface: 'android',
    branch: 'feat/native-e2e-perf-metrics',
    sha: 'ec599e58884046a48e76624c63a644663278b384',
    runId: '1842',
    runAttempt: '1',
    shard: '1',
    generatedAt: '2026-09-18T07:30:00.000Z',
};

const run: PerfRun = {
    context,
    artifacts: [{ kind: 'native-report', name: 'report', body: '{"screens":[]}\n' }],
    measurements: [
        {
            scenario: 'home',
            samples: 3,
            metrics: { 'rn:ttffMs': 412, 'rn:ttiMs': 980 },
            artifact: 'report',
        },
        { scenario: 'accounts', samples: 3, metrics: { 'rn:ttffMs': null }, artifact: 'report' },
    ],
};

const webRun: PerfRun = {
    context: { ...context, surface: 'web', shard: '3' },
    artifacts: [{ kind: 'flow-result', name: 'wallet-discovery', body: '{}' }],
    measurements: [
        {
            scenario: 'wallet-discovery',
            variant: 'T3W1',
            samples: 5,
            metrics: { 'lh:total-blocking-time': 672.46 },
            artifact: 'wallet-discovery',
        },
    ],
};

describe('slugify', () => {
    it('flattens slashes and drops what a key cannot carry', () => {
        expect(slugify('feat/native-e2e-perf-metrics')).toBe('feat__native-e2e-perf-metrics');
        expect(slugify('release/2026-09 (rc1)')).toBe('release__2026-09-rc1');
        expect(slugify('')).toBe('unknown');
    });

    it('trims dashes off both ends', () => {
        expect(slugify('---feat--thing---')).toBe('feat--thing');
    });

    it('stays linear on a long run of dashes, which a backtracking trim would not', () => {
        const started = Date.now();

        expect(slugify(`${'-'.repeat(200_000)}x`)).toBe('x');
        expect(Date.now() - started).toBeLessThan(1000);
    });
});

describe('keys', () => {
    it('puts the surface high, so lifecycle rules can differ per surface', () => {
        expect(artifactKey(context, 'report')).toBe(
            'runs/android/feat__native-e2e-perf-metrics/ec599e58884046a48e76624c63a644663278b384/1842-1/shard-1/report.json',
        );
        expect(artifactKey({ ...context, surface: 'web' }, 'report')).toContain('runs/web/');
    });

    it('keeps the shards of one run apart', () => {
        expect(artifactKey({ ...context, shard: '2' }, 'report')).not.toBe(
            artifactKey(context, 'report'),
        );
    });

    it('gives each shard of a pull request its own immutable index file', () => {
        expect(indexKey({ ...context, prNumber: '32587' })).toBe(
            'index/android/pr/32587/1842-1-1.ndjson',
        );
    });

    it('appends branch runs to one rolling index per surface', () => {
        expect(indexKey({ ...context, branch: 'develop' })).toBe(
            'index/android/develop/index.ndjson',
        );
    });

    it('serves every key from the public origin', () => {
        expect(publicUrl(baselineKey('web', 'develop'))).toBe(
            'https://dev.suite.sldev.cz/e2e/perf/v1/baseline/web/develop/latest.json',
        );
    });
});

describe('measurementLabel', () => {
    it('keeps two variants of one scenario apart', () => {
        expect(measurementLabel({ scenario: 'home', samples: 1, metrics: {} })).toBe('home');
        expect(
            measurementLabel({ scenario: 'home', variant: 'T3W1', samples: 1, metrics: {} }),
        ).toBe('home [T3W1]');
    });
});

describe('toIndexRows', () => {
    it('carries the identity, the metrics and the artifact to drill into', () => {
        expect(toIndexRows(run)[0]).toMatchObject({
            surface: 'android',
            scenario: 'home',
            shard: '1',
            samples: 3,
            metrics: { 'rn:ttffMs': 412, 'rn:ttiMs': 980 },
            blob: { kind: 'native-report', key: artifactKey(context, 'report') },
        });
    });

    it('labels a Lighthouse artifact by its own kind', () => {
        expect(toIndexRows(webRun)[0]?.blob?.kind).toBe('flow-result');
    });

    it('keeps an unmeasured metric as null rather than dropping it', () => {
        expect(toIndexRows(run)[1]?.metrics).toEqual({ 'rn:ttffMs': null });
    });

    it('marks a row from a profiled run, so a trend can keep the two populations apart', () => {
        const rows = toIndexRows({ ...run, context: { ...context, profiled: true } });

        expect(rows[0]?.profiled).toBe(true);
    });

    it('leaves the mark off an ordinary run rather than writing false on every row', () => {
        expect(toIndexRows(run)[0]).not.toHaveProperty('profiled');
    });

    it('leaves out the blob when the named artifact was not produced', () => {
        const rows = toIndexRows({
            ...run,
            artifacts: [],
        });

        expect(rows[0]?.blob).toBeUndefined();
        expect(rows[0]?.metrics).toEqual({ 'rn:ttffMs': 412, 'rn:ttiMs': 980 });
    });
});

describe('ndjson', () => {
    it('round-trips rows', () => {
        expect(parseNdjson(renderNdjson(toIndexRows(run)))).toEqual(toIndexRows(run));
    });

    it('renders nothing for no rows', () => {
        expect(renderNdjson([])).toBe('');
    });

    it('drops a line it cannot parse instead of failing', () => {
        expect(parseNdjson('{"scenario":"home"}\nnot json\n\n')).toEqual([{ scenario: 'home' }]);
    });
});

describe('appendIndexRows', () => {
    const existing = renderNdjson(toIndexRows(run));

    it('adds the rows of a later run after the ones already there', () => {
        const later = toIndexRows({ ...run, context: { ...context, runId: '1843' } });

        expect(parseNdjson(appendIndexRows(existing, later))).toHaveLength(4);
    });

    it('replaces the lines of a re-run instead of doubling them', () => {
        expect(parseNdjson(appendIndexRows(existing, toIndexRows(run)))).toHaveLength(2);
    });

    it('keeps the lines of another shard of the same run', () => {
        const otherShard = toIndexRows({ ...run, context: { ...context, shard: '2' } });

        expect(parseNdjson(appendIndexRows(existing, otherShard))).toHaveLength(4);
    });

    it('keeps the lines of another surface measured at the same time', () => {
        const other = toIndexRows({ ...run, context: { ...context, surface: 'ios' } });

        expect(parseNdjson(appendIndexRows(existing, other))).toHaveLength(4);
    });

    it('starts a file that does not exist yet', () => {
        expect(parseNdjson(appendIndexRows('', toIndexRows(run)))).toHaveLength(2);
    });
});

describe('toBaselineDocument', () => {
    it('merges every shard into the document later runs are compared against', () => {
        expect(
            toBaselineDocument([run, { ...run, context: { ...context, shard: '2' } }]),
        ).toMatchObject({
            surface: 'android',
            run: '1842',
            measurements: {
                home: { 'rn:ttffMs': 412, 'rn:ttiMs': 980 },
                accounts: { 'rn:ttffMs': null },
            },
        });
    });

    it('keys a variant separately', () => {
        expect(Object.keys(toBaselineDocument([webRun]).measurements)).toEqual([
            'wallet-discovery [T3W1]',
        ]);
    });
});

describe('buildUploadBundle', () => {
    it('writes artifacts before the index, so no line points at a missing object', () => {
        const paths = buildUploadBundle([run]).map(file => file.path);

        expect(paths).toEqual([artifactKey(context, 'report'), indexKey(context)]);
    });

    it('writes one artifact per shard and one shared rolling index', () => {
        const second = { ...run, context: { ...context, shard: '2' } };
        const paths = buildUploadBundle([run, second]).map(file => file.path);

        expect(paths).toEqual([
            artifactKey(context, 'report'),
            artifactKey({ ...context, shard: '2' }, 'report'),
            indexKey(context),
        ]);
    });

    it('gives each shard of a pull request its own index file', () => {
        const prContext = { ...context, prNumber: '32587' };
        const runs = [
            { ...run, context: prContext },
            { ...run, context: { ...prContext, shard: '2' } },
        ];

        expect(buildUploadBundle(runs).filter(file => file.path.includes('/pr/'))).toHaveLength(2);
    });

    it('seals the baseline only when asked', () => {
        expect(buildUploadBundle([run]).map(file => file.path)).not.toContain(
            baselineKey('android', context.branch),
        );
        expect(buildUploadBundle([run], { sealBaseline: true }).map(file => file.path)).toContain(
            baselineKey('android', context.branch),
        );
    });

    it('appends to the index a branch already has', () => {
        const previous = renderNdjson(
            toIndexRows({ ...run, context: { ...context, runId: '1841' } }),
        );
        const index = buildUploadBundle([run], {
            existingIndex: { [indexKey(context)]: previous },
        }).find(file => file.path === indexKey(context));

        expect(parseNdjson(index?.body ?? '')).toHaveLength(4);
    });

    it('seals one baseline per surface, not one for whichever run came first', () => {
        // A web run and a desktop run of the same branch label their measurements identically
        // (`wallet-discovery [T3W1]`), so a single document would file one surface's numbers under
        // the other's key and drop the rest.
        const webMeasured: PerfRun = {
            context: { ...context, surface: 'web' },
            artifacts: [{ kind: 'flow-result', name: 'flow', body: '{}\n' }],
            measurements: [
                {
                    scenario: 'home',
                    samples: 1,
                    metrics: { 'lh:bootup-time': 12 },
                    artifact: 'flow',
                },
            ],
        };

        const baselines = buildUploadBundle([run, webMeasured], { sealBaseline: true }).filter(
            file => file.path.startsWith('baseline/'),
        );

        expect(baselines.map(file => file.path).toSorted()).toEqual([
            baselineKey('android', context.branch),
            baselineKey('web', context.branch),
        ]);

        const android = JSON.parse(
            baselines.find(file => file.path === baselineKey('android', context.branch))?.body ??
                '',
        );
        // The android baseline keeps android's numbers; the web run does not overwrite them.
        expect(android.measurements.home).toEqual({ 'rn:ttffMs': 412, 'rn:ttiMs': 980 });
    });

    it("appends each rolling index to its own history, not to a sibling surface's", () => {
        const webContext = { ...context, surface: 'web' as const };
        const webEmpty: PerfRun = { context: webContext, artifacts: [], measurements: [] };
        const androidHistory = renderNdjson(
            toIndexRows({ ...run, context: { ...context, runId: '1841' } }),
        );

        const files = buildUploadBundle([run, { ...webEmpty, measurements: run.measurements }], {
            existingIndex: { [indexKey(context)]: androidHistory },
        });
        const webIndex = files.find(file => file.path === indexKey(webContext));

        // Web has no history of its own yet, so it gets only this run's rows — android's history
        // belongs to android's file.
        expect(parseNdjson(webIndex?.body ?? '')).toHaveLength(2);
        expect(parseNdjson(webIndex?.body ?? '').every(row => row.surface === 'web')).toBe(true);
    });

    it('never appends for a pull request, whose file is its own', () => {
        const prContext = { ...context, prNumber: '32587' };
        const previous = renderNdjson(toIndexRows({ ...run, context: prContext }));
        const index = buildUploadBundle([{ ...run, context: prContext }], {
            existingIndex: { [indexKey(prContext)]: previous },
        }).find(file => file.path === indexKey(prContext));

        expect(parseNdjson(index?.body ?? '')).toHaveLength(2);
    });
});
