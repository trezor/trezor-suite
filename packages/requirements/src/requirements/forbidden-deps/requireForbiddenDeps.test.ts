import { getForbiddenDependencyErrors } from './requireForbiddenDeps';

describe(getForbiddenDependencyErrors.name, () => {
    it('matches package-name regexes without forbidding similarly named packages', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [
                    { field: 'dependencies', name: '@trezor/connect' },
                    { field: 'devDependencies', name: '@trezor/connect-web' },
                    { field: 'dependencies', name: '@trezor/connect-common' },
                    { field: 'dependencies', name: '@trezor/connect-web-extra' },
                ],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '^@trezor/connect(?:-web)?$',
                            reason: 'Inject the client.',
                        },
                    ],
                },
                workspaceName: '@trezor/network-example',
            }),
        ).toEqual([
            '@trezor/network-example: "@trezor/connect" is forbidden in dependencies. Reason: Inject the client.',
            '@trezor/network-example: "@trezor/connect-web" is forbidden in devDependencies. Reason: Inject the client.',
        ]);
    });

    it('reports invalid regexes even when there are no dependencies to check', () => {
        expect(
            getForbiddenDependencyErrors({
                dependencyOccurrences: [],
                dependencyRule: {
                    'forbidden-deps': [
                        {
                            packageNamePattern: '[',
                            reason: 'Invalid configuration.',
                        },
                    ],
                },
                workspaceName: '@trezor/network-example',
            }),
        ).toEqual([
            '@trezor/network-example: "[" in "forbidden-deps" is not a valid packageNamePattern regular expression.',
        ]);
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
