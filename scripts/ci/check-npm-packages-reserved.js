// Fails the connect NPM release before anything is published if any package that is about to be
// released does not exist on the npm registry yet.
//
// CI cannot publish a brand-new package name: npm requires the package to exist before a trusted
// publisher (OIDC) can be configured for it, so `yarn npm publish` fails with "YN0033: No
// authentication configured for request". Since packages are published in dependency order, hitting
// this in the middle of a release leaves it half-published (dependencies out, connect not).
//
// Usage: node ./scripts/ci/check-npm-packages-reserved.js '["utils","transport"]'

import { isPackageOnNpmRegistry } from './npm-registry.js';

// Kept in sync with the `deploy-npm-connect` matrix in .github/workflows/release-connect-npm.yml.
const CONNECT_PACKAGES = ['connect', 'connect-web', 'connect-webextension', 'connect-mobile'];

// What `identify-release-packages` passes instead of an empty array.
const NO_PACKAGES_TO_RELEASE = 'no-packages-to-release';

const [packagesToReleaseJSON] = process.argv.slice(2);

if (!packagesToReleaseJSON) {
    throw new Error(
        'Reserved packages check requires 1 parameter: JSON array of package names to release',
    );
}

const packagesToRelease = JSON.parse(packagesToReleaseJSON);

if (!Array.isArray(packagesToRelease)) {
    throw new Error(`Expected a JSON array of package names, got ${packagesToReleaseJSON}`);
}

const packagesToCheck = [
    ...new Set([
        ...packagesToRelease.filter(packageName => packageName !== NO_PACKAGES_TO_RELEASE),
        ...CONNECT_PACKAGES,
    ]),
];

const results = await Promise.all(
    packagesToCheck.map(async packageName => ({
        packageName,
        isReserved: await isPackageOnNpmRegistry(`@trezor/${packageName}`),
    })),
);

const unreservedPackages = results
    .filter(({ isReserved }) => !isReserved)
    .map(({ packageName }) => packageName);

if (!unreservedPackages.length) {
    console.log(`All ${packagesToCheck.length} packages to release exist on the npm registry.`);
    process.exit(0);
}

console.log(
    `::error title=Unreserved npm package names::${unreservedPackages.join(', ')} - reserve the names before releasing, see the job log`,
);
console.error(
    [
        '',
        `These packages are not on the npm registry yet, so CI cannot publish them:`,
        ...unreservedPackages.map(packageName => `  - @trezor/${packageName}`),
        '',
        'A maintainer with npm publish rights has to reserve each name once, locally:',
        ...unreservedPackages.map(packageName => `  yarn reserve-npm-package ${packageName}`),
        '',
        'Then re-run this workflow. See docs/packages/creating-packages.md for details.',
        '',
    ].join('\n'),
);

process.exit(1);
