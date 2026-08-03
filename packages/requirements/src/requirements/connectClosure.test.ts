import { type WorkspacePackage, collectProdWorkspaceClosure } from './connectClosure';

const pkg = (
    name: string,
    packageJson: WorkspacePackage['packageJson'] = {},
): [string, WorkspacePackage] => [name, { name, dir: `/repo/${name}`, packageJson }];

describe('collectProdWorkspaceClosure', () => {
    it('follows dependencies and optionalDependencies transitively', () => {
        const packages = new Map<string, WorkspacePackage>([
            pkg('@trezor/connect', {
                dependencies: { '@trezor/transport-web': 'workspace:*' },
                optionalDependencies: { '@trezor/optional': 'workspace:*' },
            }),
            pkg('@trezor/transport-web', {
                dependencies: { '@trezor/transport-common': 'workspace:*' },
            }),
            pkg('@trezor/transport-common', {}),
            pkg('@trezor/optional', {}),
        ]);

        const closure = collectProdWorkspaceClosure(['@trezor/connect'], packages);

        expect([...closure].sort()).toEqual([
            '@trezor/connect',
            '@trezor/optional',
            '@trezor/transport-common',
            '@trezor/transport-web',
        ]);
    });

    it('ignores devDependencies and non-workspace specifiers', () => {
        const packages = new Map<string, WorkspacePackage>([
            pkg('@trezor/connect', {
                dependencies: { 'external-lib': '^1.0.0' },
                devDependencies: { '@trezor/dev-only': 'workspace:*' },
            }),
            pkg('@trezor/dev-only', {}),
        ]);

        const closure = collectProdWorkspaceClosure(['@trezor/connect'], packages);

        expect([...closure]).toEqual(['@trezor/connect']);
    });

    it('unions the closures of multiple roots and traverses through version-less packages', () => {
        const packages = new Map<string, WorkspacePackage>([
            pkg('@trezor/connect', { dependencies: { '@trezor/utils': 'workspace:*' } }),
            pkg('@trezor/connect-web', {
                dependencies: { '@trezor/connect-common': 'workspace:*' },
            }),
            // No version field — must still be traversed so its dependency is reached.
            pkg('@trezor/connect-common', { dependencies: { '@trezor/utils': 'workspace:*' } }),
            pkg('@trezor/utils', { version: '10.0.0-beta.1' }),
        ]);

        const closure = collectProdWorkspaceClosure(
            ['@trezor/connect', '@trezor/connect-web'],
            packages,
        );

        expect([...closure].sort()).toEqual([
            '@trezor/connect',
            '@trezor/connect-common',
            '@trezor/connect-web',
            '@trezor/utils',
        ]);
    });

    it('skips roots that are not workspace packages', () => {
        const packages = new Map<string, WorkspacePackage>([pkg('@trezor/connect', {})]);

        const closure = collectProdWorkspaceClosure(
            ['@trezor/connect', '@trezor/does-not-exist'],
            packages,
        );

        expect([...closure]).toEqual(['@trezor/connect']);
    });
});
