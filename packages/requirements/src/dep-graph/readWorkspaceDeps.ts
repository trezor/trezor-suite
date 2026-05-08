// Filesystem-backed dependency resolver factory for `computePublishClosure`.
// Returns each package's `@trezor/*` `dependencies` + `peerDependencies`
// (without the `@trezor/` prefix), skipping `devDependencies`.
//
// Uses `listWorkspacePackages` so it picks up `@trezor/*` packages anywhere
// in the workspace (e.g. `suite/e2e/` or `suite-common/`), not just under
// `packages/<name>/`.

import type { PackageDepsResolver } from './computePublishClosure';
import { listWorkspacePackages } from './listWorkspacePackages';

const TREZOR_PREFIX = '@trezor/';

const stripTrezorPrefix = (dependencyName: string): string | null =>
    dependencyName.startsWith(TREZOR_PREFIX) ? dependencyName.slice(TREZOR_PREFIX.length) : null;

export const createReadWorkspaceDeps = (repoRoot: string): PackageDepsResolver => {
    const workspaces = listWorkspacePackages(repoRoot);

    return packageName => {
        const workspace = workspaces.get(`${TREZOR_PREFIX}${packageName}`);
        if (workspace === undefined) {
            return [];
        }

        const { packageJson } = workspace;
        const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
        const peerDependencies = packageJson.peerDependencies
            ? Object.keys(packageJson.peerDependencies)
            : [];

        return [...dependencies, ...peerDependencies]
            .map(stripTrezorPrefix)
            .filter((name): name is string => name !== null);
    };
};
