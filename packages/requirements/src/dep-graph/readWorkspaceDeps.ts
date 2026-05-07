// Filesystem-backed dependency resolver factory for `computePublishClosure`.
// Returns each package's `@trezor/*` `dependencies` + `peerDependencies`
// (without the `@trezor/` prefix), skipping `devDependencies`.
//
// Pass the absolute path to the repo root explicitly — this module is
// agnostic about how the caller resolves it (`import.meta.dirname` works
// for ESM scripts, `process.cwd()` works for tools run from the repo root).

import fs from 'node:fs';
import path from 'node:path';

import type { PackageDepsResolver } from './computePublishClosure';

const TREZOR_PREFIX = '@trezor/';

const stripTrezorPrefix = (dependencyName: string): string | null =>
    dependencyName.startsWith(TREZOR_PREFIX) ? dependencyName.slice(TREZOR_PREFIX.length) : null;

export const createReadWorkspaceDeps = (repoRoot: string): PackageDepsResolver => {
    const packagesDir = path.join(repoRoot, 'packages');

    return packageName => {
        const packageJsonPath = path.join(packagesDir, packageName, 'package.json');
        const rawPackageJson = fs.readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(rawPackageJson);

        const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
        const peerDependencies = packageJson.peerDependencies
            ? Object.keys(packageJson.peerDependencies)
            : [];

        return [...dependencies, ...peerDependencies]
            .map(stripTrezorPrefix)
            .filter((name): name is string => name !== null);
    };
};
