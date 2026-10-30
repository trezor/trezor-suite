import path from 'node:path';

import type { WorkspacePackage } from '@trezor/requirements';

import { toReleaseScriptName } from './publish-closure';

const root = path.resolve(__dirname, '../..');

const workspacePackage = (name: string, relativeDir: string): WorkspacePackage => ({
    name,
    dir: path.join(root, relativeDir),
    packageJson: { name },
});

describe('toReleaseScriptName', () => {
    it.each([
        ['@trezor/connect', 'packages/connect', 'connect'],
        ['@trezor/network-tron', 'networks/tron/network-tron', 'network-tron'],
    ])('maps %s to the name the connect release scripts address it by', (name, dir, expected) => {
        expect(toReleaseScriptName(root, workspacePackage(name, dir))).toBe(expected);
    });

    it('rejects a member outside the @trezor scope', () => {
        expect(() =>
            toReleaseScriptName(
                root,
                workspacePackage('@suite-common/wallet-core', 'suite-common/wallet-core'),
            ),
        ).toThrow('@suite-common/wallet-core is not in the @trezor scope');
    });

    it('rejects a member whose directory the release scripts would resolve elsewhere', () => {
        expect(() =>
            toReleaseScriptName(root, workspacePackage('@trezor/suite-e2e', 'suite/e2e')),
        ).toThrow(
            '@trezor/suite-e2e lives in suite/e2e, but the connect release scripts resolve it to packages/suite-e2e',
        );
    });
});
