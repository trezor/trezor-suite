import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { type ExecResult } from './execCliCommand';
import { createGetAffectedWorkspaces } from './getAffectedWorkspaces';

type CreateTestGetAffectedWorkspacesOptions = {
    readonly workspaceListResult: ExecResult;
    readonly affectedResult: ExecResult;
};

const createTestGetAffectedWorkspaces = (options: CreateTestGetAffectedWorkspacesOptions) =>
    createGetAffectedWorkspaces({
        execCliCommand: jest
            .fn()
            .mockResolvedValueOnce(options.workspaceListResult)
            .mockResolvedValueOnce(options.affectedResult),
        requirementsWorkspaceName: '@trezor/requirements',
    });

describe(createGetAffectedWorkspaces.name, () => {
    afterEach(() => {
        delete process.env.NX_BASE;
        delete process.env.NX_HEAD;
    });

    it('returns only affected workspaces', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                    '{"name":"@trezor/suite","location":"packages/suite"}',
                    '{"name":"@trezor/requirements","location":"packages/requirements"}',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stderr: '',
                stdout: '["@trezor/connect","@trezor/suite"]',
            },
        });

        const result = await getAffectedWorkspaces('/repo/packages/requirements');

        expect(result).toEqual({
            repoRoot: '/repo',
            workspaces: [
                { name: '@trezor/connect', dir: '/repo/packages/connect' },
                { name: '@trezor/suite', dir: '/repo/packages/suite' },
            ],
        });
    });

    it('returns all workspaces when @trezor/requirements is affected', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                    '{"name":"@trezor/suite","location":"packages/suite"}',
                    '{"name":"@trezor/requirements","location":"packages/requirements"}',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stderr: '',
                stdout: '["@trezor/requirements"]',
            },
        });

        const result = await getAffectedWorkspaces('/repo/packages/requirements');

        expect(result).toEqual({
            repoRoot: '/repo',
            workspaces: [
                { name: '@trezor/connect', dir: '/repo/packages/connect' },
                { name: '@trezor/suite', dir: '/repo/packages/suite' },
                { name: '@trezor/requirements', dir: '/repo/packages/requirements' },
            ],
        });
    });

    it('returns empty workspace list when nx output is empty', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stderr: '',
                stdout: '\n',
            },
        });

        const result = await getAffectedWorkspaces('/repo/packages/requirements');

        expect(result).toEqual({
            repoRoot: '/repo',
            workspaces: [],
        });
    });

    it('throws when nx command fails', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 1,
                stdout: '',
                stderr: 'fatal: bad revision',
            },
        });

        await expect(getAffectedWorkspaces('/repo/packages/requirements')).rejects.toThrow(
            'Failed to determine affected projects: fatal: bad revision',
        );
    });

    it('throws when nx output is not an array of project names', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stdout: '{"projects":["@trezor/connect"]}',
                stderr: '',
            },
        });

        await expect(getAffectedWorkspaces('/repo/packages/requirements')).rejects.toThrow(
            'Failed to determine affected projects: invalid Nx output format.',
        );
    });

    it('throws when listing workspaces fails', async () => {
        const getAffectedWorkspaces = createGetAffectedWorkspaces({
            execCliCommand: jest.fn(() =>
                Promise.resolve({
                    exitCode: 1,
                    stdout: '',
                    stderr: 'boom',
                }),
            ),
            requirementsWorkspaceName: '@trezor/requirements',
        });

        await expect(getAffectedWorkspaces('/repo/packages/requirements')).rejects.toThrow(
            'Failed to list workspaces: boom',
        );
    });

    it('ignores empty lines in workspace list output', async () => {
        const getAffectedWorkspaces = createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    '{"name":"trezor-suite","location":"."}',
                    '',
                    '{"name":"@trezor/connect","location":"packages/connect"}',
                    '',
                ].join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stderr: '',
                stdout: '["@trezor/connect"]',
            },
        });

        const result = await getAffectedWorkspaces('/repo/packages/requirements');

        expect(result).toEqual({
            repoRoot: '/repo',
            workspaces: [{ name: '@trezor/connect', dir: '/repo/packages/connect' }],
        });
    });
});

describe('workspaces covered by inherited dependency policies', () => {
    let repoRoot: string;

    beforeEach(() => {
        repoRoot = mkdtempSync(join(tmpdir(), 'affected-workspaces-'));
        mkdirSync(join(repoRoot, 'networks', 'ethereum'), { recursive: true });
        mkdirSync(join(repoRoot, 'packages', 'requirements'), { recursive: true });
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    const createGetWorkspaces = (affectedProjects: ReadonlyArray<string>) =>
        createTestGetAffectedWorkspaces({
            workspaceListResult: {
                exitCode: 0,
                stderr: '',
                stdout: [
                    { name: 'trezor-suite', location: '.' },
                    { name: '@trezor/network-example', location: 'networks/ethereum/example' },
                    { name: '@trezor/network-other', location: 'networks/bitcoin/other' },
                    { name: '@trezor/unrelated', location: 'networks-extra/example' },
                    { name: '@trezor/utils', location: 'packages/utils' },
                ]
                    .map(workspace => JSON.stringify(workspace))
                    .join('\n'),
            },
            affectedResult: {
                exitCode: 0,
                stderr: '',
                stdout: JSON.stringify(affectedProjects),
            },
        });

    it('checks descendants after a policy-only edit when Nx selects no projects', async () => {
        writeFileSync(join(repoRoot, 'networks', 'forbiddenDeps.config.ts'), '');

        const getWorkspaces = createGetWorkspaces([]);
        const result = await getWorkspaces(join(repoRoot, 'packages', 'requirements'));

        expect(result.workspaces.map(workspace => workspace.name)).toEqual([
            '@trezor/network-example',
            '@trezor/network-other',
        ]);
    });

    it('includes nested policy descendants alongside Nx-affected workspaces', async () => {
        writeFileSync(join(repoRoot, 'networks', 'ethereum', 'forbiddenDeps.config.ts'), '');

        const getWorkspaces = createGetWorkspaces(['@trezor/utils']);
        const result = await getWorkspaces(join(repoRoot, 'packages', 'requirements'));

        expect(result.workspaces.map(workspace => workspace.name)).toEqual([
            '@trezor/network-example',
            '@trezor/utils',
        ]);
    });

    it('checks every workspace covered by a repository-root policy', async () => {
        writeFileSync(join(repoRoot, 'forbiddenDeps.config.ts'), '');

        const getWorkspaces = createGetWorkspaces([]);
        const result = await getWorkspaces(join(repoRoot, 'packages', 'requirements'));

        expect(result.workspaces.map(workspace => workspace.name)).toEqual([
            '@trezor/network-example',
            '@trezor/network-other',
            '@trezor/unrelated',
            '@trezor/utils',
        ]);
    });
});
