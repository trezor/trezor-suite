import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const repositoryRoot = path.resolve(__dirname, '../..');
type CheckPreviousRunParams = {
    conclusion?: string;
    downloadFails?: boolean;
};
const actionSource = fs.readFileSync(
    path.join(repositoryRoot, '.github/actions/check-previous-test-runs/action.yml'),
    'utf8',
);
const runBlock = actionSource.match(/ {6}run: \|\n([\s\S]*?)(?=\n {4}- name:|$)/)?.[1];
if (!runBlock) throw new Error('Check Previous Test Runs shell step is missing');

const actionScript = runBlock
    .split('\n')
    .map(line => line.slice(8))
    .join('\n')
    .replaceAll('${{ github.event_name }}', 'pull_request')
    .replaceAll('${{ github.workspace }}', repositoryRoot)
    .replaceAll('${{ inputs.pr_branch }}', 'test-branch')
    .replaceAll('${{ inputs.pr_created }}', '2026-10-01T00:00:00Z')
    .replaceAll('${{ inputs.repo }}', 'trezor/trezor-suite')
    .replaceAll('${{ inputs.workflow_name }}', 'Android E2E')
    .replaceAll('${{ inputs.run_attempt }}', '1');

describe('check-previous-test-runs', () => {
    let temporaryDirectory: string;
    let artifactsDirectory: string;
    let outputPath: string;

    beforeEach(() => {
        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'check-e2e-reuse-'));
        artifactsDirectory = path.join(temporaryDirectory, 'artifacts');
        outputPath = path.join(temporaryDirectory, 'output');
        fs.mkdirSync(artifactsDirectory);
        fs.writeFileSync(outputPath, '');
        fs.writeFileSync(
            path.join(temporaryDirectory, 'curl'),
            '#!/usr/bin/env bash\nprintf \'%s\\n\' "$MOCK_PREVIOUS_RUN"\n',
            { mode: 0o755 },
        );
        fs.writeFileSync(
            path.join(temporaryDirectory, 'gh'),
            [
                '#!/usr/bin/env bash',
                'if [[ "$1 $2" == "workflow list" ]]; then echo 12; exit 0; fi',
                'if [[ "$1 $2" == "run download" ]]; then',
                '  if [[ "$MOCK_DOWNLOAD_FAILS" == "true" ]]; then exit 1; fi',
                '  while [[ "$1" != "--dir" ]]; do shift; done',
                '  mkdir -p "$2"',
                '  cp -R "$MOCK_ARTIFACTS/." "$2"',
                '  exit 0',
                'fi',
                'exit 1',
                '',
            ].join('\n'),
            { mode: 0o755 },
        );
    });

    afterEach(() => fs.rmSync(temporaryDirectory, { recursive: true, force: true }));

    const createShardReport = (shard: number, contents: string) => {
        const directory = path.join(artifactsDirectory, 'e2e-reuse-status-1-' + shard);
        fs.mkdirSync(directory);
        fs.writeFileSync(path.join(directory, 'e2e-reuse-status.json'), contents);
    };

    const checkPreviousRun = ({
        conclusion = 'success',
        downloadFails = false,
    }: CheckPreviousRunParams = {}) => {
        const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', actionScript], {
            cwd: repositoryRoot,
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: temporaryDirectory + ':' + process.env.PATH,
                GITHUB_OUTPUT: outputPath,
                GH_TOKEN: 'mock-token',
                EVENT_NAME: 'pull_request',
                PR_BRANCH: 'test-branch',
                PR_CREATED_TIMESTAMP: '2026-10-01T00:00:00Z',
                REPO: 'trezor/trezor-suite',
                WORKFLOW_NAME: 'Android E2E',
                RUN_ATTEMPT: '1',
                TEST_SHARDS: '5',
                MOCK_ARTIFACTS: artifactsDirectory,
                MOCK_DOWNLOAD_FAILS: String(downloadFails),
                MOCK_PREVIOUS_RUN: JSON.stringify({
                    workflow_runs: [
                        {
                            id: 123,
                            run_attempt: 1,
                            conclusion,
                            html_url: 'https://github.com/trezor/trezor-suite/actions/runs/123',
                        },
                    ],
                }),
            },
        });
        expect({ exitCode: result.status, stderr: result.stderr }).toEqual({
            exitCode: 0,
            stderr: '',
        });

        return fs.readFileSync(outputPath, 'utf8').trim().split('\n').at(-1);
    };

    it('reuses a successful run only when all shards passed without raw failures', () => {
        for (let shard = 0; shard < 5; shard++) createShardReport(shard, '{"hasFailures":false}');

        expect(checkPreviousRun()).toBe('skip_tests=true');
    });

    it('reruns after a quarantined failure even when the workflow succeeded', () => {
        for (let shard = 0; shard < 5; shard++) {
            createShardReport(shard, JSON.stringify({ hasFailures: shard === 2 }));
        }

        expect(checkPreviousRun()).toBe('skip_tests=false');
    });

    it('reruns when a shard report is missing', () => {
        for (let shard = 0; shard < 4; shard++) createShardReport(shard, '{"hasFailures":false}');

        expect(checkPreviousRun()).toBe('skip_tests=false');
    });

    it.each(['{}', '{"hasFailures":"false"}', 'invalid JSON'])(
        'reruns when a shard report is invalid: %s',
        contents => {
            for (let shard = 0; shard < 5; shard++) createShardReport(shard, contents);

            expect(checkPreviousRun()).toBe('skip_tests=false');
        },
    );

    it('reruns when the artifacts cannot be downloaded', () => {
        expect(checkPreviousRun({ downloadFails: true })).toBe('skip_tests=false');
    });

    it('reruns when the previous workflow failed', () => {
        expect(checkPreviousRun({ conclusion: 'failure' })).toBe('skip_tests=false');
    });
});
