// Network packages have different nesting depths and directory names, so resolve their paths
// from the workspace globs and package manifests. Plain `.js` so it can be imported from
// both the tsx and node scripts, and run as a CLI from `release-connect-npm/action.yml`.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..', '..');

const findNetworkPackageRelativePath = packageName => {
    const { workspaces } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const networkManifestGlobs = workspaces.packages
        .filter(workspace => workspace.startsWith('networks/'))
        .map(workspace => path.posix.join(workspace, 'package.json'));

    for (const manifestPath of fs.globSync(networkManifestGlobs, { cwd: ROOT })) {
        const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, manifestPath), 'utf8'));

        if (manifest.name === `@trezor/${packageName}`) {
            return path.dirname(manifestPath).replaceAll(path.sep, '/');
        }
    }
};

// Repo-relative path (posix slashes) for git pathspecs and `yarn bump`. Name has no `@trezor/`.
export const getTrezorPackageRelativePath = packageName => {
    if (!packageName.startsWith('network-')) {
        return path.posix.join('packages', packageName);
    }

    const networkPackagePath = findNetworkPackageRelativePath(packageName);

    if (!networkPackagePath) {
        throw new Error(`Package @trezor/${packageName} not found in ./networks`);
    }

    return networkPackagePath;
};

export const getTrezorPackageDir = packageName =>
    path.join(ROOT, getTrezorPackageRelativePath(packageName));

// CLI: prints the absolute package dir, e.g. `cd "$(node trezor-package-path.js network-tron)"`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [packageName] = process.argv.slice(2);
    if (!packageName) {
        throw new Error('Usage: node ./scripts/ci/trezor-package-path.js <packageName>');
    }
    process.stdout.write(getTrezorPackageDir(packageName));
}
