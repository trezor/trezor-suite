import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { listShardDirectories, publishFromCi, resolveRunIdentity } from './publishRuns';

describe('resolveRunIdentity', () => {
    it('takes the branch under test from a pull request, not the merge ref', () => {
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

describe('listShardDirectories', () => {
    let root: string;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-artifacts-'));
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('lists matching artifact directories in shard order, ignoring the rest', () => {
        ['report-2', 'report-1', 'unrelated'].forEach(name => fs.mkdirSync(path.join(root, name)));
        fs.writeFileSync(path.join(root, 'report-3'), '');

        expect(listShardDirectories(root, /^report-(.+)$/)).toEqual([
            { shard: '1', directory: path.join(root, 'report-1') },
            { shard: '2', directory: path.join(root, 'report-2') },
        ]);
    });

    it('returns nothing when no artifact was downloaded', () => {
        expect(listShardDirectories(path.join(root, 'missing'), /^report-(.+)$/)).toEqual([]);
    });
});

describe('publishFromCi', () => {
    const originalEnv = process.env;

    let log: jest.SpyInstance;

    beforeEach(() => {
        log = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    it('does not collect runs outside CI', async () => {
        process.env = {};
        const collectRuns = jest.fn(() => []);

        await publishFromCi(collectRuns);

        expect(collectRuns).not.toHaveBeenCalled();
    });

    it('never throws, so publishing cannot fail the job', async () => {
        process.env = { GITHUB_REF_NAME: 'develop', GITHUB_SHA: 'aaa' };

        await expect(
            publishFromCi(() => {
                throw new Error('broken artifact');
            }),
        ).resolves.toBeUndefined();
        expect(log).toHaveBeenCalledWith('[performance] Publishing failed: broken artifact');
    });
});
