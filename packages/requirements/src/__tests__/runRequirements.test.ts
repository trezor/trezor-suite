import type { Requirement } from '../requirements/Requirement';
import { runRequirements } from '../runRequirements';

const createRepoRequirement = (
    overrides: Partial<Requirement<'repo'>> & { name: string },
): Requirement<'repo'> => ({
    scope: 'repo',
    verify: () => Promise.resolve([]),
    ...overrides,
});

const createWorkspaceRequirement = (
    overrides: Partial<Requirement<'workspace'>> & { name: string },
): Requirement<'workspace'> => ({
    scope: 'workspace',
    verify: () => Promise.resolve([]),
    ...overrides,
});

const workspaces = [
    { dir: '/repo/packages/alpha', name: '@trezor/alpha' },
    { dir: '/repo/packages/beta', name: '@trezor/beta' },
];

describe('runRequirements', () => {
    describe('repo-scoped requirements', () => {
        it('returns no errors when verify passes', async () => {
            const results = await runRequirements({
                requirements: [createRepoRequirement({ name: 'passing' })],
                repoRoot: '/repo',
                mode: 'verify',
            });

            expect(results).toHaveLength(1);
            const first = results[0];
            expect(first?.errors).toEqual([]);
            expect(first?.target).toBe('repo');
        });

        it('returns errors from verify', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'failing',
                        verify: () => Promise.resolve(['something is wrong']),
                    }),
                ],
                repoRoot: '/repo',
                mode: 'verify',
            });

            expect(results).toHaveLength(1);
            const first = results[0];
            expect(first?.errors).toEqual(['something is wrong']);
            expect(first?.requirement).toBe('failing');
        });

        it('calls fix when mode is fix and fix is defined', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'fixable',
                        verify: () => Promise.resolve(['broken']),
                        fix: () => Promise.resolve([]),
                    }),
                ],
                repoRoot: '/repo',
                mode: 'fix',
            });

            expect(results).toHaveLength(1);
            expect(results[0]?.errors).toEqual([]);
        });

        it('falls back to verify when mode is fix but fix is undefined', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'no-fix',
                        verify: () => Promise.resolve(['still broken']),
                    }),
                ],
                repoRoot: '/repo',
                mode: 'fix',
            });

            expect(results).toHaveLength(1);
            expect(results[0]?.errors).toEqual(['still broken']);
        });
    });

    describe('workspace-scoped requirements', () => {
        it('runs against each workspace', async () => {
            const visited: string[] = [];

            await runRequirements({
                requirements: [
                    createWorkspaceRequirement({
                        name: 'tracker',
                        verify: ctx => {
                            visited.push(ctx.workspaceName);

                            return Promise.resolve([]);
                        },
                    }),
                ],
                repoRoot: '/repo',
                workspaces,
                mode: 'verify',
            });

            expect(visited).toEqual(['@trezor/alpha', '@trezor/beta']);
        });

        it('skips workspaces where applies returns false', async () => {
            const results = await runRequirements({
                requirements: [
                    createWorkspaceRequirement({
                        name: 'selective',
                        applies: ctx => ctx.workspaceName === '@trezor/alpha',
                        verify: () => Promise.resolve(['error']),
                    }),
                ],
                repoRoot: '/repo',
                workspaces,
                mode: 'verify',
            });

            // Only alpha should have the error; beta was skipped
            expect(results).toHaveLength(1);
            expect(results[0]?.target).toBe('alpha');
        });

        it('collects errors across multiple workspaces', async () => {
            const results = await runRequirements({
                requirements: [
                    createWorkspaceRequirement({
                        name: 'broken-everywhere',
                        verify: ctx => Promise.resolve([`${ctx.workspaceName} is broken`]),
                    }),
                ],
                repoRoot: '/repo',
                workspaces,
                mode: 'verify',
            });

            expect(results).toHaveLength(2);
            expect(results[0]?.errors).toEqual(['@trezor/alpha is broken']);
            expect(results[1]?.errors).toEqual(['@trezor/beta is broken']);
        });

        it('includes workspace results even with no errors', async () => {
            const results = await runRequirements({
                requirements: [
                    createWorkspaceRequirement({
                        name: 'partial-fail',
                        verify: ctx =>
                            Promise.resolve(
                                ctx.workspaceName === '@trezor/alpha' ? ['broken'] : [],
                            ),
                    }),
                ],
                repoRoot: '/repo',
                workspaces,
                mode: 'verify',
            });

            expect(results).toHaveLength(2);
            const alpha = results[0];
            const beta = results[1];
            expect(alpha?.target).toBe('alpha');
            expect(alpha?.errors).toEqual(['broken']);
            expect(beta?.target).toBe('beta');
            expect(beta?.errors).toEqual([]);
        });
    });

    describe('filtering', () => {
        it('runs only the requirement matching the filter', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'req-a',
                        verify: () => Promise.resolve(['a-error']),
                    }),
                    createRepoRequirement({
                        name: 'req-b',
                        verify: () => Promise.resolve(['b-error']),
                    }),
                ],
                repoRoot: '/repo',
                filter: 'req-a',
                mode: 'verify',
            });

            expect(results).toHaveLength(1);
            expect(results[0]?.requirement).toBe('req-a');
        });

        it('returns empty results when filter matches nothing', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'req-a',
                        verify: () => Promise.resolve(['error']),
                    }),
                ],
                repoRoot: '/repo',
                filter: 'nonexistent',
                mode: 'verify',
            });

            expect(results).toEqual([]);
        });
    });

    describe('mixed scopes', () => {
        it('handles repo and workspace requirements together', async () => {
            const results = await runRequirements({
                requirements: [
                    createRepoRequirement({
                        name: 'repo-check',
                        verify: () => Promise.resolve(['repo-error']),
                    }),
                    createWorkspaceRequirement({
                        name: 'ws-check',
                        verify: () => Promise.resolve(['ws-error']),
                    }),
                ],
                repoRoot: '/repo',
                workspaces,
                mode: 'verify',
            });

            const repoResults = results.filter(r => r.target === 'repo');
            const wsResults = results.filter(r => r.target !== 'repo');

            expect(repoResults).toHaveLength(1);
            expect(wsResults).toHaveLength(2);
        });
    });
});
