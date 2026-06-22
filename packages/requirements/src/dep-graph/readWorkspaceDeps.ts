// Filesystem-backed dependency resolver factory for `computePublishClosure`.
// Returns each package's `@trezor/*` `dependencies` + `peerDependencies`
// (without the `@trezor/` prefix), skipping `devDependencies`.
//
// Reads through the shared `workspaces.ts` helpers so it picks up @trezor/*
// packages anywhere in the workspace (e.g. `suite/e2e/` or `suite-common/`),
// not just under `packages/<name>/`.

import type { PackageDepsResolver } from './computePublishClosure';
import { getWorkspaceDirectoryMap, readPackageJson } from '../workspaces';

const TREZOR_PREFIX = '@trezor/';

type WorkspacePackageJson = {
    readonly dependencies?: Record<string, string>;
    readonly peerDependencies?: Record<string, string>;
};

const stripTrezorPrefix = (dependencyName: string): string | null =>
    dependencyName.startsWith(TREZOR_PREFIX) ? dependencyName.slice(TREZOR_PREFIX.length) : null;

export const createReadWorkspaceDeps = (repoRoot: string): PackageDepsResolver => {
    const workspaceDirs = getWorkspaceDirectoryMap(repoRoot);

    return packageName => {
        const dir = workspaceDirs.get(`${TREZOR_PREFIX}${packageName}`);
        if (dir === undefined) {
            return [];
        }

        const packageJson = readPackageJson<WorkspacePackageJson>(dir);
        const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
        const peerDependencies = packageJson.peerDependencies
            ? Object.keys(packageJson.peerDependencies)
            : [];

        return [...dependencies, ...peerDependencies]
            .map(stripTrezorPrefix)
            .filter((name): name is string => name !== null);
    };
};
