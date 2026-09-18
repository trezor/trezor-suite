import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { collectShardReports, resolveRunIdentity, toPerfRun } from './publishPerformance';
import type { PerformanceReport } from './types';

const identity = { branch: 'develop', sha: 'abc1234', runId: '9', runAttempt: '1' };

const report = (
    screen: string,
    platform: PerformanceReport['meta']['platform'] = 'android',
): PerformanceReport => ({
    meta: {
        platform,
        device: 'Pixel_7_API_34',
        appVersion: '25.9.1',
        commitHash: 'abc1234',
        generatedAt: '2026-09-18T07:30:00.000Z',
        sampleCount: 1,
    },
    screens: [
        {
            scenario: screen,
            overLimit: false,
            unlimited: false,
            sampleCount: 2,
            metrics: [
                {
                    key: 'ttffMs',
                    label: 'Time to first frame',
                    unit: 'ms',
                    baseline: null,
                    current: 412,
                    limit: 800,
                    ratioToLimit: 0.5,
                    exceededLimit: false,
                },
            ],
        },
    ],
    aggregate: { score: 90, overLimit: false },
});

const writeArtifact = (root: string, dirName: string, body: string) => {
    fs.mkdirSync(path.join(root, dirName), { recursive: true });
    fs.writeFileSync(path.join(root, dirName, 'perf-report.json'), body);
};

describe('collectShardReports', () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-artifacts-'));
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('reads one report per shard artifact, in shard order', () => {
        writeArtifact(root, 'android-perf-report-2', JSON.stringify(report('accounts')));
        writeArtifact(root, 'android-perf-report-1', JSON.stringify(report('home')));

        expect(collectShardReports(root).map(({ shard }) => shard)).toEqual(['1', '2']);
    });

    it('ignores directories that are not shard artifacts', () => {
        writeArtifact(root, 'some-other-artifact', JSON.stringify(report('home')));

        expect(collectShardReports(root)).toEqual([]);
    });

    it('skips an unreadable report instead of failing the publish', () => {
        writeArtifact(root, 'android-perf-report-1', 'not json');
        writeArtifact(root, 'android-perf-report-2', JSON.stringify(report('home')));

        expect(collectShardReports(root).map(({ shard }) => shard)).toEqual(['2']);
    });

    it('returns nothing when no artifact was downloaded', () => {
        expect(collectShardReports(path.join(root, 'missing'))).toEqual([]);
    });
});

describe('toPerfRun', () => {
    it('maps a shard report onto the shared envelope, namespacing the metric keys', () => {
        const run = toPerfRun({ shard: '3', report: report('home') }, identity);

        expect(run?.context).toMatchObject({
            surface: 'android',
            shard: '3',
            branch: 'develop',
            generatedAt: '2026-09-18T07:30:00.000Z',
            env: { device: 'Pixel_7_API_34', appVersion: '25.9.1' },
        });
        expect(run?.measurements).toEqual([
            { scenario: 'home', samples: 2, metrics: { 'rn:ttffMs': 412 }, artifact: 'report' },
        ]);
    });

    it('stores the whole report once, as the artifact every screen drills into', () => {
        const run = toPerfRun({ shard: '1', report: report('home') }, identity);

        expect(run?.artifacts).toHaveLength(1);
        expect(run?.artifacts[0]).toMatchObject({ kind: 'native-report', name: 'report' });
    });

    it('keeps iOS on its own surface', () => {
        expect(
            toPerfRun({ shard: '1', report: report('home', 'ios') }, identity)?.context.surface,
        ).toBe('ios');
    });

    it('skips a run whose platform is unknown rather than filing it under a guess', () => {
        expect(toPerfRun({ shard: '1', report: report('home', 'unknown') }, identity)).toBeNull();
    });
});

describe('resolveRunIdentity', () => {
    it('takes the branch under test from a pull request', () => {
        expect(
            resolveRunIdentity({
                GITHUB_HEAD_REF: 'feat/thing',
                GITHUB_REF_NAME: '32587/merge',
                GITHUB_SHA: 'aaa',
                PERF_SHA: 'bbb',
                GITHUB_RUN_ID: '9',
                GITHUB_RUN_ATTEMPT: '2',
                PERF_PR_NUMBER: '32587',
            }),
        ).toEqual({
            branch: 'feat/thing',
            sha: 'bbb',
            runId: '9',
            runAttempt: '2',
            prNumber: '32587',
        });
    });

    it('falls back to the pushed branch and the run defaults', () => {
        expect(resolveRunIdentity({ GITHUB_REF_NAME: 'develop', GITHUB_SHA: 'aaa' })).toEqual({
            branch: 'develop',
            sha: 'aaa',
            runId: 'local',
            runAttempt: '1',
        });
    });

    it('publishes nothing outside CI, where there is no branch', () => {
        expect(resolveRunIdentity({})).toBeNull();
    });
});
