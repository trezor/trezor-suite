import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ForbiddenDepsConfig } from './forbiddenDepsTypes';
import {
    getAllowedDependencyErrors,
    getDependencyConsumerErrors,
    getForbiddenDependencyErrors,
    requireForbiddenDeps,
} from './requireForbiddenDeps';
import { getWorkspaceDirectoryMap } from '../../workspaces';
import type { WorkspaceContext } from '../Requirement';

jest.mock('../../workspaces');

const writeConfig = (directory: string, config: ForbiddenDepsConfig) => {
    writeFileSync(
        join(directory, 'forbiddenDeps.config.ts'),
        `export const forbiddenDepsConfig = ${JSON.stringify(config)};`,
    );
};

describe(requireForbiddenDeps.name, () => {
    let context: WorkspaceContext;

    beforeEach(() => {
        const repoRoot = mkdtempSync(join(tmpdir(), 'forbidden-deps-'));
        const workspaceDir = join(repoRoot, 'networks', 'ethereum', 'example');
        context = { repoRoot, workspaceDir, workspaceName: '@trezor/network-example' };

        mkdirSync(workspaceDir, { recursive: true });
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({
                name: context.workspaceName,
                dependencies: {
                    '@suite-common/wallet-core': 'workspace:*',
                    '@suite-common/calldata': 'workspace:*',
                    '@trezor/utils': 'workspace:*',
                },
            }),
        );
        jest.mocked(getWorkspaceDirectoryMap).mockReturnValue(
            new Map([
                [context.workspaceName, workspaceDir],
                ['@suite-common/wallet-core', join(repoRoot, 'suite-common', 'wallet-core')],
                ['@suite-common/calldata', join(repoRoot, 'suite-common', 'calldata')],
                ['@trezor/utils', join(repoRoot, 'packages', 'utils')],
            ]),
        );
    });

    afterEach(() => {
        rmSync(context.repoRoot, { recursive: true, force: true });
    });

    it('inherits a parent policy without a workspace config and preserves exceptions', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'forbidden-deps': [
                {
                    packageNamePrefix: '@suite-common/',
                    except: ['@suite-common/calldata'],
                    reason: 'Below the apps.',
                },
            ],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Below the apps.',
        ]);
    });

    it('enforces local and inherited rules together', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'forbidden-deps': [
                { packageName: '@suite-common/wallet-core', reason: 'Parent policy.' },
            ],
        });
        writeConfig(context.workspaceDir, {
            'forbidden-deps': [{ packageName: '@suite-common/calldata', reason: 'Local policy.' }],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Parent policy.',
            '@trezor/network-example: "@suite-common/calldata" is forbidden in dependencies. Reason: Local policy.',
        ]);
    });

    it('reports an unknown package in an inherited policy', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'forbidden-deps': [
                { packageName: '@suite-common/wallet-cor', reason: 'Misspelled package.' },
            ],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/wallet-cor" in "forbidden-deps" is not an existing workspace package.',
        ]);
    });

    it('inherits an allowlist and reports the dependencies outside it', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'allowed-deps': {
                packageNamePrefixes: ['@trezor/'],
                except: ['@suite-common/calldata'],
                reason: 'Only the layers below.',
            },
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/wallet-core" is not an allowed dependency in dependencies. Reason: Only the layers below.',
        ]);
    });

    it('reports an unknown package in an inherited allowlist exception', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'allowed-deps': {
                packageNamePrefixes: ['@trezor/', '@suite-common/'],
                except: ['@suite-common/calldat'],
                reason: 'Misspelled package.',
            },
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/calldat" in "allowed-deps" is not an existing workspace package.',
        ]);
    });

    it('does not inherit policies outside the workspace ancestors', async () => {
        const siblingDirectory = join(context.repoRoot, 'suite-common');
        mkdirSync(siblingDirectory);
        writeConfig(siblingDirectory, {
            'forbidden-deps': [{ packageNamePrefix: '@suite-common/', reason: 'Another subtree.' }],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([]);
    });
});

describe(getForbiddenDependencyErrors.name, () => {
    it('rejects an exact forbidden dependency', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    {
                        field: 'dependencies',
                        name: '@suite-common/extra-dependencies',
                    },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageName: '@suite-common/extra-dependencies',
                            reason: 'Redux utilities must stay domain-independent.',
                        },
                    ],
                },
                workspaceName: '@suite-common/redux-utils',
            }),
        ).toEqual([
            '@suite-common/redux-utils: "@suite-common/extra-dependencies" is forbidden in dependencies. Reason: Redux utilities must stay domain-independent.',
        ]);
    });

    it('rejects dependencies matching a forbidden package-name prefix', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    { field: 'dependencies', name: '@suite-common/wallet-core' },
                    { field: 'dependencies', name: '@trezor/utils' },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePrefix: '@suite-common/',
                            reason: 'Redux utilities must stay domain-independent.',
                        },
                    ],
                },
                workspaceName: '@suite-common/redux-utils',
            }),
        ).toEqual([
            '@suite-common/redux-utils: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Redux utilities must stay domain-independent.',
        ]);
    });
});

describe('forbidden package-name prefix exceptions', () => {
    it('lets a listed package through while still rejecting the rest of the prefix', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    { field: 'dependencies', name: '@suite-common/calldata' },
                    { field: 'dependencies', name: '@suite-common/wallet-core' },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePrefix: '@suite-common/',
                            except: ['@suite-common/calldata'],
                            reason: 'Below the apps.',
                        },
                    ],
                },
                workspaceName: '@trezor/network-bitcoin-suite-common',
            }),
        ).toEqual([
            '@trezor/network-bitcoin-suite-common: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Below the apps.',
        ]);
    });
});

describe(getAllowedDependencyErrors.name, () => {
    const workspaceDirectories = new Map([
        ['@suite-native/atoms', '/repo/suite-native/atoms'],
        ['@suite/metadata', '/repo/suite/metadata'],
        ['@trezor/utils', '/repo/packages/utils'],
    ]);

    const getErrors = (dependencyNames: ReadonlyArray<string>, except?: ReadonlyArray<string>) =>
        getAllowedDependencyErrors({
            allowedDepsRules: [
                {
                    packageNamePrefixes: ['@trezor/', '@suite-native/'],
                    except,
                    reason: 'Only the layers below the mobile app.',
                },
            ],
            dependencyOccurrences: dependencyNames.map(name => ({
                field: 'dependencies' as const,
                name,
            })),
            workspaceDirectories,
            workspaceName: '@suite-native/module-home',
        });

    it('accepts dependencies matching an allowed prefix', () => {
        expect(getErrors(['@trezor/utils', '@suite-native/atoms'])).toEqual([]);
    });

    it('rejects a workspace dependency outside the allowed prefixes', () => {
        expect(getErrors(['@suite/metadata'])).toEqual([
            '@suite-native/module-home: "@suite/metadata" is not an allowed dependency in dependencies. Reason: Only the layers below the mobile app.',
        ]);
    });

    it('accepts a dependency named as an exception', () => {
        expect(getErrors(['@suite/metadata'], ['@suite/metadata'])).toEqual([]);
    });

    it('ignores packages outside the monorepo', () => {
        expect(getErrors(['react-native'])).toEqual([]);
    });
});

describe(getDependencyConsumerErrors.name, () => {
    const connectConfig: ForbiddenDepsConfig = {
        'forbidden-in': {
            packageNamePattern: '^@trezor/network-',
            reason: 'Inject the client.',
        },
    };

    it.each([
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ] as const)(
        'rejects a network consumer in %s using the dependency-owned config',
        async field => {
            const errors = await getDependencyConsumerErrors({
                dependencyOccurrences: [{ field, name: '@trezor/connect' }],
                workspaceName: '@trezor/network-future',
                repoRoot: '/repo',
                getWorkspaceDirByName: () => '/repo/packages/connect',
                loadConfig: () => Promise.resolve(connectConfig),
            });

            expect(errors).toEqual([
                `@trezor/network-future: "@trezor/connect" is forbidden in ${field} by its "forbidden-in" rule. Reason: Inject the client.`,
            ]);
        },
    );

    it('allows applications to depend on Connect', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect' }],
            workspaceName: '@trezor/suite',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/packages/connect',
            loadConfig: () => Promise.resolve(connectConfig),
        });

        expect(errors).toEqual([]);
    });

    it('allows dependencies without consumer restrictions', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect-common' }],
            workspaceName: '@trezor/network-ethereum',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/packages/connect-common',
            loadConfig: () => Promise.resolve(undefined),
        });

        expect(errors).toEqual([]);
    });

    it('preserves allowed-only-in restrictions', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/example' }],
            workspaceName: '@trezor/suite',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/packages/example',
            loadConfig: () =>
                Promise.resolve({
                    'allowed-only-in': {
                        packages: ['@trezor/another-app'],
                        reason: 'Internal implementation.',
                    },
                }),
        });

        expect(errors).toEqual([
            '@trezor/suite: "@trezor/example" is allowed only in "@trezor/another-app" and must not be listed in dependencies. Reason: Internal implementation.',
        ]);
    });

    it('does not let allowed-only-in bypass forbidden-in', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect' }],
            workspaceName: '@trezor/network-ethereum',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/packages/connect',
            loadConfig: () =>
                Promise.resolve({
                    ...connectConfig,
                    'allowed-only-in': {
                        packages: ['@trezor/network-ethereum'],
                        reason: 'Internal implementation.',
                    },
                }),
        });

        expect(errors).toEqual([
            '@trezor/network-ethereum: "@trezor/connect" is forbidden in dependencies by its "forbidden-in" rule. Reason: Inject the client.',
        ]);
    });

    it('reports an invalid consumer pattern against the dependency owning it', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect' }],
            workspaceName: '@trezor/network-ethereum',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/packages/connect',
            loadConfig: () =>
                Promise.resolve({
                    'forbidden-in': { packageNamePattern: '[', reason: 'Invalid configuration.' },
                }),
        });

        expect(errors).toEqual([
            '@trezor/connect: "[" in "forbidden-in" is not a valid packageNamePattern regular expression.',
        ]);
    });
});
