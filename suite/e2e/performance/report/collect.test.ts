import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { collectSamples } from './collect';

const fixtureLhr = () =>
    JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'account-switch.lhr.json'), 'utf8'));

const flowResult = (steps: string[]) => ({
    name: 'some test',
    steps: steps.map(name => ({ name, lhr: fixtureLhr() })),
});

const flowMeta = (overrides: Record<string, unknown> = {}) => ({
    model: 'T3W1',
    target: 'desktop',
    retry: 0,
    title: 'some test',
    ...overrides,
});

const perfReport = (scenario: string, current = 35, overrides: Record<string, unknown> = {}) => ({
    meta: { scenario, model: 'T3W1', target: 'desktop', retry: 0, ...overrides },
    report: {
        scenario,
        overLimit: false,
        unlimited: false,
        metrics: [
            {
                key: 'reactCommitCount',
                label: 'React commits',
                unit: 'count',
                baseline: null,
                current,
                limit: null,
                ratioToLimit: null,
                exceededLimit: false,
            },
        ],
    },
});

describe('collectSamples', () => {
    let root: string;

    const testDir = (name: string, files: Record<string, unknown>) => {
        const dir = join(root, name);
        mkdirSync(dir, { recursive: true });
        for (const [file, content] of Object.entries(files)) {
            writeFileSync(join(dir, file), JSON.stringify(content));
        }
    };

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'perf-report-collect-'));
    });

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it('pairs a flow result, its meta and its perf report into one sample', () => {
        testDir('some-test-T3W1', {
            'lighthouse-flow-result.json': flowResult(['account-switch']),
            'lighthouse-flow-meta.json': flowMeta(),
            'perf-report-account-switch.json': perfReport('account-switch'),
        });

        const { samples, problems } = collectSamples(root);

        expect(problems).toEqual([]);
        expect(samples).toHaveLength(1);
        expect(samples[0]).toMatchObject({
            target: 'desktop',
            model: 'T3W1',
            scenario: 'account-switch',
            retry: 0,
        });
        expect(samples[0]?.lhr).not.toBeNull();
        expect(samples[0]?.perfMetrics?.reactCommitCount).toBe(35);
    });

    // The LHR itself carries no model/target/retry, so a flow result without its sidecar cannot be
    // filed under any measurement.
    it('skips a flow result without its meta sidecar and says so', () => {
        testDir('meta-lost-T3W1', {
            'lighthouse-flow-result.json': flowResult(['account-switch']),
        });

        const { samples, problems } = collectSamples(root);

        expect(samples).toHaveLength(0);
        expect(problems).toHaveLength(1);
        expect(problems[0]).toContain('lighthouse-flow-meta.json');
    });

    // A failed timespan must not cost the in-page numbers: the perf report carries its own meta.
    it('yields an LHR-less sample from a perf report alone', () => {
        testDir('timespan-failed-T3W1', {
            'perf-report-wallet-discovery.json': perfReport('wallet-discovery', 214),
        });

        const { samples } = collectSamples(root);

        expect(samples).toHaveLength(1);
        expect(samples[0]?.lhr).toBeNull();
        expect(samples[0]?.perfMetrics?.reactCommitCount).toBe(214);
    });

    it('keeps retries as separate samples', () => {
        testDir('t-T3W1', {
            'lighthouse-flow-result.json': flowResult(['account-switch']),
            'lighthouse-flow-meta.json': flowMeta(),
        });
        testDir('t-T3W1-retry1', {
            'lighthouse-flow-result.json': flowResult(['account-switch']),
            'lighthouse-flow-meta.json': flowMeta({ retry: 1 }),
        });

        const { samples } = collectSamples(root);

        expect(samples).toHaveLength(2);
        expect(samples.map(sample => sample.retry).sort()).toEqual([0, 1]);
    });

    // Downloaded CI artifacts nest one directory per shard above the test directories.
    it('walks nested shard directories', () => {
        testDir(join('perf-results-web-group-1', 'test-a-T3W1'), {
            'lighthouse-flow-result.json': flowResult(['account-switch']),
            'lighthouse-flow-meta.json': flowMeta({ target: 'web' }),
        });
        testDir(join('perf-results-desktop-group-2', 'test-b-T3T1'), {
            'perf-report-account-switch.json': perfReport('account-switch', 40, { model: 'T3T1' }),
        });

        const { samples } = collectSamples(root);

        expect(samples).toHaveLength(2);
        expect(samples.map(sample => sample.target).sort()).toEqual(['desktop', 'web']);
    });

    it('reports malformed files as problems instead of throwing', () => {
        const dir = join(root, 'broken-T3W1');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'lighthouse-flow-result.json'), 'not json');
        writeFileSync(join(dir, 'perf-report-x.json'), '{"meta": {}}');

        const { samples, problems } = collectSamples(root);

        expect(samples).toHaveLength(0);
        expect(problems.length).toBeGreaterThan(0);
    });
});
