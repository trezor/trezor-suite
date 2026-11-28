import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { PERF_REPORT_MARKER } from './markdown';
import {
    listPublishedPlatforms,
    listShardDirectories,
    publishFromCi,
    publishRuns,
    resolveRunIdentity,
} from './publishRuns';
import type { PerfRun } from './store';
import { buildUploadBundle, indexKey } from './store';

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

    it("appends a pull request's push to the runs it already published", async () => {
        const prRun = { ...run, context: { ...run.context, prNumber: '35380' } };
        respond(200, '{"scenario":"earlier push"}\n');

        await publishRuns({ runs: [prRun], bundleRoot, log: () => {} });
        const index = fs.readFileSync(path.join(bundleRoot, indexKey(prRun.context)), 'utf8');

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

describe('listPublishedPlatforms', () => {
    const run = (platform: PerfRun['context']['platform'], prNumber?: string): PerfRun => ({
        context: {
            platform,
            branch: 'feat/thing',
            commitId: 'aaa',
            runId: '9',
            runAttempt: '1',
            shard: '1',
            generatedAt: '2026-10-20T00:00:00.000Z',
            ...(prNumber ? { prNumber } : {}),
        },
        artifacts: [],
        measurements: [{ scenario: 'wallet-discovery', samples: 1, metrics: {} }],
    });

    it('links a pull request per platform and counts its measurements across shards', () => {
        const runs = [
            run('web', '35380'),
            run('desktop', '35380'),
            {
                ...run('desktop', '35380'),
                context: { ...run('desktop', '35380').context, shard: '2' },
            },
        ];

        expect(listPublishedPlatforms(runs, buildUploadBundle(runs))).toEqual([
            {
                platform: 'web',
                measurementCount: 1,
                dashboardUrl: expect.stringMatching(/\?platform=web&pr=35380$/),
            },
            {
                platform: 'desktop',
                measurementCount: 2,
                dashboardUrl: expect.stringMatching(/\?platform=desktop&pr=35380$/),
            },
        ]);
    });

    it('links a branch run to its branch trend', () => {
        const runs = [run('android')];

        expect(listPublishedPlatforms(runs, buildUploadBundle(runs))[0]?.dashboardUrl).toMatch(
            /\?platform=android&branch=feat%2Fthing$/,
        );
    });

    it('leaves out a platform whose index this bundle does not write', () => {
        expect(listPublishedPlatforms([run('web', '1')], [])).toEqual([]);
    });
});

describe('publishFromCi on a pull request', () => {
    const originalEnv = process.env;
    const prRun: PerfRun = {
        context: {
            platform: 'desktop',
            branch: 'feat/thing',
            commitId: 'ec599e58884046a48e76624c63a644663278b384',
            runId: '9',
            runAttempt: '1',
            shard: '1',
            prNumber: '35380',
            generatedAt: '2026-10-20T00:00:00.000Z',
        },
        artifacts: [],
        measurements: [{ scenario: 'wallet-discovery', samples: 1, metrics: {} }],
    };

    let root: string;
    let summaryPath: string;
    let log: jest.SpyInstance;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-ci-'));
        summaryPath = path.join(root, 'summary.md');
        process.env = {
            GITHUB_HEAD_REF: 'feat/thing',
            GITHUB_SHA: 'aaa',
            PERF_COMMIT_ID: prRun.context.commitId,
            PERF_PR_NUMBER: '35380',
            PERF_RUN_URL: 'https://github.com/trezor/trezor-suite/actions/runs/9',
            PERF_BUNDLE_DIR: path.join(root, 'bundle'),
            GITHUB_STEP_SUMMARY: summaryPath,
        };
        log = jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 404,
            text: () => Promise.resolve(''),
        } as Response);
    });

    afterEach(() => {
        process.env = originalEnv;
        fs.rmSync(root, { recursive: true, force: true });
        jest.restoreAllMocks();
    });

    it("links the pull request's results from its performance comment, starting it if needed", async () => {
        const upsertPrComment = jest.fn().mockResolvedValue('created');

        await publishFromCi(() => [prRun], { upsertPrComment });

        expect(upsertPrComment).toHaveBeenCalledWith(
            expect.objectContaining({ marker: PERF_REPORT_MARKER, createIfMissing: true }),
        );
        const [{ buildBody, holdsOwnContent }] = upsertPrComment.mock.calls[0];
        const body = buildBody(undefined);

        expect(body).toContain(PERF_REPORT_MARKER);
        expect(body).toContain('dashboard/index.html?platform=desktop&pr=35380');
        expect(holdsOwnContent(body)).toBe(true);
        expect(holdsOwnContent('somebody else wrote this')).toBe(false);
    });

    it('replaces its own line on a later push instead of adding another', async () => {
        const upsertPrComment = jest.fn().mockResolvedValue('updated');

        await publishFromCi(() => [prRun], { upsertPrComment });
        const [{ buildBody }] = upsertPrComment.mock.calls[0];
        const twice = buildBody(buildBody(undefined));

        expect(twice.match(/this pull request on the dashboard/g)).toHaveLength(1);
    });

    it('writes the dashboard link into the job summary', async () => {
        await publishFromCi(() => [prRun], { upsertPrComment: jest.fn().mockResolvedValue('') });

        expect(fs.readFileSync(summaryPath, 'utf8')).toContain('platform=desktop&pr=35380');
    });

    it('says in the job summary when nothing was published', async () => {
        const upsertPrComment = jest.fn();

        await publishFromCi(() => [], { upsertPrComment });

        expect(fs.readFileSync(summaryPath, 'utf8')).toContain('Nothing published');
        expect(upsertPrComment).not.toHaveBeenCalled();
    });

    it('does not comment on a branch run', async () => {
        const upsertPrComment = jest.fn();
        delete process.env.PERF_PR_NUMBER;

        await publishFromCi(
            () => [{ ...prRun, context: { ...prRun.context, prNumber: undefined } }],
            {
                upsertPrComment,
            },
        );

        expect(upsertPrComment).not.toHaveBeenCalled();
    });

    it('never fails the job over a comment it could not write', async () => {
        const upsertPrComment = jest.fn().mockRejectedValue(new Error('403'));

        await expect(publishFromCi(() => [prRun], { upsertPrComment })).resolves.toBeUndefined();
        expect(log).toHaveBeenCalledWith(
            '[performance] Could not link the results on the pull request: 403',
        );
    });
});
