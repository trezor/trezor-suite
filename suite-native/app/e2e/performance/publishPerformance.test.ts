import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { collectShardReports, resolveStoreContext } from './publishPerformance';

const writeArtifact = (root: string, dirName: string, body: string) => {
    fs.mkdirSync(path.join(root, dirName), { recursive: true });
    fs.writeFileSync(path.join(root, dirName, 'perf-report.json'), body);
};

const report = (screen: string) =>
    JSON.stringify({
        meta: {
            platform: 'android',
            device: 'Pixel_7_API_34',
            appVersion: '25.9.1',
            commitHash: 'abc1234',
            generatedAt: '2026-09-18T07:30:00.000Z',
            sampleCount: 1,
        },
        screens: [
            { scenario: screen, overLimit: false, unlimited: false, sampleCount: 1, metrics: [] },
        ],
        aggregate: { score: 90, overLimit: false },
    });

describe('collectShardReports', () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-artifacts-'));
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('reads one report per shard artifact, in shard order', () => {
        writeArtifact(root, 'android-perf-report-2', report('accounts'));
        writeArtifact(root, 'android-perf-report-1', report('home'));

        expect(collectShardReports(root).map(({ shard }) => shard)).toEqual(['1', '2']);
    });

    it('ignores directories that are not shard artifacts', () => {
        writeArtifact(root, 'some-other-artifact', report('home'));

        expect(collectShardReports(root)).toEqual([]);
    });

    it('skips an unreadable report instead of failing the publish', () => {
        writeArtifact(root, 'android-perf-report-1', 'not json');
        writeArtifact(root, 'android-perf-report-2', report('home'));

        expect(collectShardReports(root).map(({ shard }) => shard)).toEqual(['2']);
    });

    it('returns nothing when no artifact was downloaded', () => {
        expect(collectShardReports(path.join(root, 'missing'))).toEqual([]);
    });
});

describe('resolveStoreContext', () => {
    it('takes the branch under test from a pull request', () => {
        expect(
            resolveStoreContext({
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
        expect(resolveStoreContext({ GITHUB_REF_NAME: 'develop', GITHUB_SHA: 'aaa' })).toEqual({
            branch: 'develop',
            sha: 'aaa',
            runId: 'local',
            runAttempt: '1',
        });
    });

    it('publishes nothing outside CI, where there is no branch', () => {
        expect(resolveStoreContext({})).toBeNull();
    });
});
