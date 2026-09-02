import { getForbiddenDependencyErrors } from './requireForbiddenDeps';

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
