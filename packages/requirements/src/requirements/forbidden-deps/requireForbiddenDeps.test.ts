import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ForbiddenDepsConfig } from './forbiddenDepsTypes';
import {
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
                    '@suite-common/example': 'workspace:*',
                    '@trezor/utils': 'workspace:*',
                },
            }),
        );
        jest.mocked(getWorkspaceDirectoryMap).mockReturnValue(
            new Map([
                [context.workspaceName, workspaceDir],
                ['@suite-common/wallet-core', join(repoRoot, 'suite-common', 'wallet-core')],
                ['@suite-common/example', join(repoRoot, 'suite-common', 'example')],
                ['@trezor/utils', join(repoRoot, 'packages', 'utils')],
            ]),
        );
    });

    afterEach(() => {
        rmSync(context.repoRoot, { recursive: true, force: true });
    });

    it.each([false, true])(
        'reports an invalid inherited consumer pattern without importers (local policy: %s)',
        async hasLocalPolicy => {
            writeConfig(join(context.repoRoot, 'networks'), {
                'forbidden-in': { packageNamePattern: '[', reason: 'Invalid inherited policy.' },
            });
            if (hasLocalPolicy) {
                writeConfig(context.workspaceDir, {
                    'forbidden-in': {
                        packageNamePattern: '^@suite-native/',
                        reason: 'Local policy.',
                    },
                });
            }

            expect(await requireForbiddenDeps.verify(context)).toEqual([
                '@trezor/network-example: "[" in "forbidden-in" is not a valid packageNamePattern regular expression.',
            ]);
        },
    );

    it('enforces the app directory boundary even when the package has a local policy', async () => {
        const appDirectory = join(context.repoRoot, 'suite-app');
        const appWorkspace = join(appDirectory, 'future-page');
        mkdirSync(appWorkspace, { recursive: true });
        writeConfig(appDirectory, {
            'forbidden-in': {
                packageNamePattern: '^(?!@suite-app/)',
                reason: 'Application assembly is not reusable.',
            },
        });
        writeConfig(appWorkspace, {
            'forbidden-in': {
                packageNamePattern: '^@suite-native/',
                reason: 'Local policy.',
            },
        });
        writeFileSync(
            join(context.workspaceDir, 'package.json'),
            JSON.stringify({
                name: context.workspaceName,
                dependencies: { '@suite-app/future-page': 'workspace:*' },
            }),
        );
        jest.mocked(getWorkspaceDirectoryMap).mockReturnValue(
            new Map([
                [context.workspaceName, context.workspaceDir],
                ['@suite-app/future-page', appWorkspace],
            ]),
        );

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-app/future-page" is forbidden in dependencies by its "forbidden-in" rule. Reason: Application assembly is not reusable.',
        ]);
    });

    it('inherits a parent policy without a workspace config and preserves exceptions', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'forbidden-deps': [
                {
                    packageNamePattern: '^@suite-common/',
                    except: ['@suite-common/example'],
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
                { packageNamePattern: '^@suite-common/wallet-core$', reason: 'Parent policy.' },
            ],
        });
        writeConfig(context.workspaceDir, {
            'forbidden-deps': [
                { packageNamePattern: '^@suite-common/example$', reason: 'Local policy.' },
            ],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Parent policy.',
            '@trezor/network-example: "@suite-common/example" is forbidden in dependencies. Reason: Local policy.',
        ]);
    });

    it('allows patterns for future workspace packages', async () => {
        writeConfig(join(context.repoRoot, 'networks'), {
            'forbidden-deps': [
                { packageNamePattern: '^@suite-common/future-network-', reason: 'Future policy.' },
            ],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([]);
    });

    it('reports an invalid dependency pattern', async () => {
        writeConfig(context.workspaceDir, {
            'forbidden-deps': [{ packageNamePattern: '[', reason: 'Invalid configuration.' }],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([
            '@trezor/network-example: "[" in "forbidden-deps" is not a valid packageNamePattern regular expression.',
        ]);
    });

    it('does not inherit policies outside the workspace ancestors', async () => {
        const siblingDirectory = join(context.repoRoot, 'suite-common');
        mkdirSync(siblingDirectory);
        writeConfig(siblingDirectory, {
            'forbidden-deps': [
                { packageNamePattern: '^@suite-common/', reason: 'Another subtree.' },
            ],
        });

        expect(await requireForbiddenDeps.verify(context)).toEqual([]);
    });
});

describe(getForbiddenDependencyErrors.name, () => {
    it.each([
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ] as const)(
        'rejects Suite network packages in %s while allowing generic assets and types',
        field => {
            const forbiddenPackages = [
                '@trezor/network-bitcoin-suite',
                '@trezor/network-bitcoin-suite-common',
                '@trezor/network-bitcoin-suite-types',
                '@trezor/network-cardano-suite-common',
                '@trezor/network-module-suite-common-types',
                '@trezor/network-future-family-suite-custom',
            ];
            const allowedPackages = [
                '@trezor/network-bitcoin-assets',
                '@trezor/network-bitcoin-types',
                '@trezor/network-module-types',
                '@trezor/network-assets-types',
                '@trezor/network-bitcoin-suitelike',
            ];
            const errors = getForbiddenDependencyErrors({
                dependencyOccurrences: [...forbiddenPackages, ...allowedPackages].map(name => ({
                    field,
                    name,
                })),
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '^@trezor/network-.+-suite(?:-.+)?$',
                            reason: 'Independent Explorer configuration.',
                        },
                    ],
                },
                workspaceName: '@trezor/connect-explorer',
            });

            expect(errors).toEqual(
                forbiddenPackages.map(
                    name =>
                        `@trezor/connect-explorer: "${name}" is forbidden in ${field}. Reason: Independent Explorer configuration.`,
                ),
            );
        },
    );

    it('matches only the named package when the pattern is anchored', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    {
                        field: 'dependencies',
                        name: '@suite-common/extra-dependencies',
                    },
                    {
                        field: 'dependencies',
                        name: '@suite-common/extra-dependencies-extra',
                    },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '^@suite-common/extra-dependencies$',
                            reason: 'Redux utilities must stay domain-independent.',
                        },
                    ],
                },
                workspaceName: '@trezor/redux-utils',
            }),
        ).toEqual([
            '@trezor/redux-utils: "@suite-common/extra-dependencies" is forbidden in dependencies. Reason: Redux utilities must stay domain-independent.',
        ]);
    });

    it('rejects dependencies matching a forbidden package-name pattern', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    { field: 'dependencies', name: '@suite-common/wallet-core' },
                    { field: 'dependencies', name: '@trezor/utils' },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '^@suite-common/',
                            reason: 'Redux utilities must stay domain-independent.',
                        },
                    ],
                },
                workspaceName: '@trezor/redux-utils',
            }),
        ).toEqual([
            '@trezor/redux-utils: "@suite-common/wallet-core" is forbidden in dependencies. Reason: Redux utilities must stay domain-independent.',
        ]);
    });
});

describe('forbidden package-name pattern exceptions', () => {
    it('lets a listed package through while still rejecting the rest of the pattern', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    { field: 'dependencies', name: '@suite-common/example' },
                    { field: 'dependencies', name: '@suite-common/wallet-core' },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '^@suite-common/',
                            except: ['@suite-common/example'],
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

    it.each([
        { workspaceName: '@trezor/network-bitcoin-suite', expectedErrors: [] },
        {
            workspaceName: '@trezor/network-bitcoin-suite-common',
            expectedErrors: [
                '@trezor/network-bitcoin-suite-common: "@suite/sign-verify" is forbidden in dependencies. Reason: Desktop and web lego only.',
            ],
        },
    ])(
        'lets $workspaceName through only when it matches allowedInPattern',
        ({ workspaceName, expectedErrors }) => {
            expect(
                getForbiddenDependencyErrors({
                    dependencyOccurrences: [{ field: 'dependencies', name: '@suite/sign-verify' }],
                    dependencyRule: {
                        'forbidden-deps': [
                            {
                                packageNamePattern: '^@suite/',
                                allowedInPattern: '^@trezor/network-[a-z0-9]+-suite$',
                                reason: 'Desktop and web lego only.',
                            },
                        ],
                    },
                    workspaceName,
                }),
            ).toEqual(expectedErrors);
        },
    );

    it('reports an invalid allowedInPattern', async () => {
        const workspaceDir = mkdtempSync(join(tmpdir(), 'forbidden-deps-'));
        writeFileSync(
            join(workspaceDir, 'package.json'),
            JSON.stringify({ name: '@trezor/network-example' }),
        );
        writeConfig(workspaceDir, {
            'forbidden-deps': [
                { packageNamePattern: '^@suite/', allowedInPattern: '[', reason: 'Invalid.' },
            ],
        });
        jest.mocked(getWorkspaceDirectoryMap).mockReturnValue(new Map());

        try {
            expect(
                await requireForbiddenDeps.verify({
                    repoRoot: workspaceDir,
                    workspaceDir,
                    workspaceName: '@trezor/network-example',
                }),
            ).toEqual([
                '@trezor/network-example: "[" in "forbidden-deps" is not a valid allowedInPattern regular expression.',
            ]);
        } finally {
            rmSync(workspaceDir, { recursive: true, force: true });
        }
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

    it.each([
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ] as const)('inherits the app boundary for %s', async field => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field, name: '@suite-app/future-page' }],
            workspaceName: '@suite/address',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/suite-app/future-page',
            loadConfig: directory =>
                Promise.resolve(
                    directory === '/repo/suite-app'
                        ? {
                              'forbidden-in': {
                                  packageNamePattern: '^(?!@suite-app/)',
                                  reason: 'Application assembly is not reusable.',
                              },
                          }
                        : undefined,
                ),
        });

        expect(errors).toEqual([
            `@suite/address: "@suite-app/future-page" is forbidden in ${field} by its "forbidden-in" rule. Reason: Application assembly is not reusable.`,
        ]);
    });

    it('allows app composition to import another app package', async () => {
        const errors = await getDependencyConsumerErrors({
            dependencyOccurrences: [{ field: 'dependencies', name: '@suite-app/future-page' }],
            workspaceName: '@suite-app/web-app',
            repoRoot: '/repo',
            getWorkspaceDirByName: () => '/repo/suite-app/future-page',
            loadConfig: directory =>
                Promise.resolve(
                    directory === '/repo/suite-app'
                        ? {
                              'forbidden-in': {
                                  packageNamePattern: '^(?!@suite-app/)',
                                  reason: 'Application assembly is not reusable.',
                              },
                          }
                        : undefined,
                ),
        });

        expect(errors).toEqual([]);
    });

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
