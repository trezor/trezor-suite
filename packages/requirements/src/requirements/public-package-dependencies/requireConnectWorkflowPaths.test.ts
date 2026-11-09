import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

jest.mock('node:child_process');

import type { RepoContext } from '../Requirement';
import { requireConnectWorkflowPaths } from './requireConnectWorkflowPaths';

const WORKSPACES = [
    { location: 'packages/connect', name: '@trezor/connect', dependencies: ['@trezor/internal'] },
    { location: 'packages/connect-web', name: '@trezor/connect-web', dependencies: [] },
    { location: 'packages/connect-mobile', name: '@trezor/connect-mobile', dependencies: [] },
    {
        location: 'packages/connect-webextension',
        name: '@trezor/connect-webextension',
        dependencies: [],
    },
    { location: 'packages/internal', name: '@trezor/internal', dependencies: ['@trezor/network'] },
    { location: 'networks/foo/network', name: '@trezor/network', dependencies: [] },
];

const CLOSURE_PATHS = WORKSPACES.map(({ location }) => `${location}/**`);

const getWorkflow = (paths: ReadonlyArray<string>) =>
    [
        'name: test',
        'on:',
        '  push:',
        '    branches: [develop]',
        '  pull_request:',
        '    # Comment above the list.',
        '    paths:',
        '      # Comment inside the list.',
        ...paths.map(path => `      - "${path}"`),
        '',
        '      - "docker/**"',
        '  workflow_dispatch:',
        '',
        'jobs: {}',
        '',
    ].join('\n');

describe(requireConnectWorkflowPaths.name, () => {
    let repoRoot: string;
    let context: RepoContext;

    const writeWorkflows = (content: string) => {
        writeFileSync(join(repoRoot, '.github/workflows/test-connect.yml'), content);
        writeFileSync(join(repoRoot, '.github/workflows/test-connect-misc.yml'), content);
    };

    beforeEach(() => {
        repoRoot = mkdtempSync(join(tmpdir(), 'connect-workflow-paths-'));
        context = { repoRoot };
        mkdirSync(join(repoRoot, '.github/workflows'), { recursive: true });

        for (const { location, name, dependencies } of WORKSPACES) {
            mkdirSync(join(repoRoot, location), { recursive: true });
            writeFileSync(
                join(repoRoot, location, 'package.json'),
                JSON.stringify({
                    name,
                    dependencies: Object.fromEntries(
                        dependencies.map(dependency => [dependency, 'workspace:*']),
                    ),
                    devDependencies: { '@trezor/dev-only': 'workspace:*' },
                }),
            );
        }

        mkdirSync(join(repoRoot, 'packages/dev-only'), { recursive: true });
        writeFileSync(
            join(repoRoot, 'packages/dev-only/package.json'),
            JSON.stringify({ name: '@trezor/dev-only' }),
        );

        jest.mocked(execFileSync).mockReturnValue(
            [...WORKSPACES, { location: 'packages/dev-only', name: '@trezor/dev-only' }]
                .map(({ location, name }) => JSON.stringify({ location, name }))
                .join('\n'),
        );
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when every closure package is listed, ignoring dev-only packages', async () => {
        writeWorkflows(getWorkflow(CLOSURE_PATHS));

        await expect(requireConnectWorkflowPaths.verify(context)).resolves.toEqual([]);
    });

    it('names the missing path in each workflow, including transitive packages', async () => {
        writeWorkflows(getWorkflow(CLOSURE_PATHS.filter(path => !path.startsWith('networks/'))));

        const errors = await requireConnectWorkflowPaths.verify(context);

        expect(errors).toHaveLength(2);
        expect(errors[0]).toContain('.github/workflows/test-connect.yml');
        expect(errors[1]).toContain('.github/workflows/test-connect-misc.yml');
        expect(errors[0]).toContain('"networks/foo/network/**"');
    });

    it('does not count paths listed under another trigger', async () => {
        const workflow = getWorkflow(
            CLOSURE_PATHS.filter(path => path !== CLOSURE_PATHS[0]),
        ).replace('    branches: [develop]', `    paths:\n      - "${CLOSURE_PATHS[0]}"`);
        writeWorkflows(workflow);

        const errors = await requireConnectWorkflowPaths.verify(context);

        expect(errors[0]).toContain(`"${CLOSURE_PATHS[0]}"`);
    });

    it('reports a workflow without a pull_request paths list', async () => {
        writeWorkflows('name: test\non:\n  pull_request:\n  workflow_dispatch:\n');

        const errors = await requireConnectWorkflowPaths.verify(context);

        expect(errors).toEqual([
            '.github/workflows/test-connect.yml has no pull_request.paths list.',
            '.github/workflows/test-connect-misc.yml has no pull_request.paths list.',
        ]);
    });
});
