import { getForbiddenDependencyErrors } from './requireForbiddenDeps';

describe(getForbiddenDependencyErrors.name, () => {
    it.each([
        '@trezor/connect',
        '@trezor/connect-web',
        '@trezor/connect-mobile',
        '@trezor/connect-webextension',
        '@trezor/connect-electron',
    ])('rejects %s in network modules without a package-local rule', name => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [{ field: 'dependencies', name }],
                dependencyRule: undefined,
                workspaceName: '@trezor/network-ethereum-suite-common',
            }),
        ).toEqual([expect.stringContaining(`${JSON.stringify(name)} is forbidden`)]);
    });

    it('allows Connect contracts in network modules and Connect clients in apps', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect-common' }],
                dependencyRule: undefined,
                workspaceName: '@trezor/network-module-suite-common-types',
            }),
        ).toEqual([]);
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [{ field: 'dependencies', name: '@trezor/connect' }],
                dependencyRule: undefined,
                workspaceName: '@trezor/suite',
            }),
        ).toEqual([]);
    });

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
