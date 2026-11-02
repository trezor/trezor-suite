import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
    listShardDirectories,
    publishFromCi,
    publishRuns,
    resolveRunIdentity,
} from './publishRuns';
import type { PerfRun } from './store';
import { indexKey } from './store';

describe('resolveRunIdentity', () => {
    it('takes the branch under test from a pull request, not the merge ref', () => {
        expect(
            resolveRunIdentity({
                GITHUB_HEAD_REF: 'feat/thing',
                GITHUB_REF_NAME: '32587/merge',
                GITHUB_SHA: 'aaa',
                PERF_COMMIT_ID: 'bbb',
                GITHUB_RUN_ID: '9',
                GITHUB_RUN_ATTEMPT: '2',
                PERF_PR_NUMBER: '32587',
            }),
        ).toEqual({
            branch: 'feat/thing',
            commitId: 'bbb',
            runId: '9',
            runAttempt: '2',
            prNumber: '32587',
        });
    });

    it('falls back to the pushed branch and the run defaults', () => {
        expect(resolveRunIdentity({ GITHUB_REF_NAME: 'develop', GITHUB_SHA: 'aaa' })).toEqual({
            branch: 'develop',
            commitId: 'aaa',
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

    it('lists every shard when the pattern carries a global flag', () => {
        ['report-1', 'report-2', 'report-3', 'report-4'].forEach(name =>
            fs.mkdirSync(path.join(root, name)),
        );

        expect(listShardDirectories(root, /^report-(.+)$/g).map(({ shard }) => shard)).toEqual([
            '1',
            '2',
            '3',
            '4',
        ]);
    });

    it('returns nothing when no artifact was downloaded', () => {
        expect(listShardDirectories(path.join(root, 'missing'), /^report-(.+)$/)).toEqual([]);
    });
});

describe('publishRuns', () => {
    const run: PerfRun = {
        context: {
            platform: 'web',
            branch: 'develop',
            commitId: 'aaa',
            runId: '9',
            runAttempt: '1',
            shard: '1',
            generatedAt: '2026-10-20T00:00:00.000Z',
        },
        artifacts: [{ kind: 'browser-report', name: 'history', body: '{}' }],
        measurements: [
            {
                scenario: 'wallet-discovery',
                samples: 1,
                metrics: { 'browser:longTaskCount': 3 },
                artifact: 'history',
            },
        ],
    };
    const rollingIndex = indexKey(run.context);

    let bundleRoot: string;

    beforeEach(() => {
        bundleRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-upload-'));
    });

    afterEach(() => {
        fs.rmSync(bundleRoot, { recursive: true, force: true });
        jest.restoreAllMocks();
    });

    const respond = (status: number, text = '') =>
        jest.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: status < 300,
            status,
            text: () => Promise.resolve(text),
        } as Response);

    it('appends to the history it read back', async () => {
        respond(200, '{"scenario":"older"}\n');

        const outcome = await publishRuns({ runs: [run], bundleRoot, log: () => {} });
        const index = fs.readFileSync(path.join(bundleRoot, rollingIndex), 'utf8');

        expect(outcome.status).toBe('written');
        expect(index.split('\n').filter(Boolean)).toHaveLength(2);
    });

    it('starts a history that does not exist yet', async () => {
        respond(404);

        await publishRuns({ runs: [run], bundleRoot, log: () => {} });

        expect(fs.existsSync(path.join(bundleRoot, rollingIndex))).toBe(true);
    });

    it.each([
        ['a server error', () => respond(503)],
        [
            'a timeout',
            () => jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('timeout')),
        ],
    ])(
        'leaves the history alone after %s, instead of overwriting it with one run',
        async (_, fail) => {
            fail();
            const log = jest.fn();

            const outcome = await publishRuns({ runs: [run], bundleRoot, log });

            expect(fs.existsSync(path.join(bundleRoot, rollingIndex))).toBe(false);
            expect(outcome.status === 'written' && outcome.files.map(file => file.path)).toEqual([
                expect.stringMatching(/^runs\//),
            ]);
            expect(log).toHaveBeenCalledWith(expect.stringMatching(/^::warning::/));
        },
    );
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
