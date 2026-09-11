import type { ForbiddenDepsConfig } from './forbiddenDepsTypes';
import { getDependencyConsumerErrors, getForbiddenDependencyErrors } from './requireForbiddenDeps';

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
