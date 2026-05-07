// Filesystem-backed dependency resolver for `computePublishClosure`.
// Returns each package's `@trezor/*` `dependencies` + `peerDependencies`
// (without the `@trezor/` prefix), skipping `devDependencies`.

import fs from 'node:fs';
import path from 'node:path';

import type { PackageDepsResolver } from './connect-publish-graph';

const TREZOR_PREFIX = '@trezor/';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

const stripTrezorPrefix = (dependencyName: string): string | null =>
    dependencyName.startsWith(TREZOR_PREFIX) ? dependencyName.slice(TREZOR_PREFIX.length) : null;

export const readWorkspaceDeps: PackageDepsResolver = packageName => {
    const packageJsonPath = path.join(PACKAGES_DIR, packageName, 'package.json');
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
