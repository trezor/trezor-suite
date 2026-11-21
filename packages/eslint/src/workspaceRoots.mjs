import { fileURLToPath } from 'node:url';

export const allRoots = {
    networks: 'networks',
    packages: 'packages',
    suite: 'suite',
    suiteApp: 'suite-app',
    suiteCli: 'suite-cli',
    suiteCommon: 'suite-common',
    suiteNative: 'suite-native',
    suiteNativeApp: 'suite-native-app',
};

/**
 * Absolute path of the repository root. A config block whose `files` start with an `allRoots`
 * directory sets it as `basePath`: ESLint resolves `files` against the directory of the nearest
 * `eslint.config.mjs`, so without it the block never matches in a workspace with its own config.
 */
export const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
