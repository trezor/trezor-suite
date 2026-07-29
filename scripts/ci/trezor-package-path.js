// Locates a @trezor/* workspace package on disk. Network packages are nested a level deeper
// (`networks/<group>/<name>`) and the group is not derivable from the name (`network-module` holds
// `network-module-suite-types`), so resolve it from disk. Plain `.js` so it can be imported from
// both the tsx and node scripts, and run as a CLI from `release-connect-npm/action.yml`.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..', '..');

const findNetworkPackageRelativePath = packageName =>
    fs
        .readdirSync(path.join(ROOT, 'networks'), { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.posix.join('networks', entry.name, packageName))
        .find(relativePath => fs.existsSync(path.join(ROOT, relativePath, 'package.json')));

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
