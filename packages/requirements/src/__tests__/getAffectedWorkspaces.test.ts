import { type ExecResult } from '../execCliCommand';
import { createGetAffectedWorkspaces } from '../getAffectedWorkspaces';

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
