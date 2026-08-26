import { readdirSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { type Plugin } from 'vite';

/**
 * Vite settings shared between the app config in this package and `suite/component-tests`, so the
 * gallery the component tests render resolves modules the same way the shipped app does.
 *
 * `import.meta.url` rather than `__dirname`: depending on the importing config, this file is
 * either bundled or loaded directly as an ES module, and only the former shims `__dirname`.
 */
const require = createRequire(import.meta.url);
const packageDir = fileURLToPath(new URL('.', import.meta.url));

// This helper creates aliases for all workspace packages
const createWorkspaceAliases = () => {
    const suiteCommonAliases = readdirSync(resolve(packageDir, '../../suite-common'), {
        withFileTypes: true,
    })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite-common/${dirent.name}`,
            replacement: resolve(packageDir, '../../suite-common', dirent.name),
        }));

    const trezorPackagesAliases = readdirSync(resolve(packageDir, '../'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'suite-web')
        .map(dirent => ({
            find: `@trezor/${dirent.name}`,
            replacement: resolve(packageDir, '../', dirent.name),
        }));

    const suiteAliases = readdirSync(resolve(packageDir, '../../suite'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite/${dirent.name}`,
            replacement: resolve(packageDir, '../../suite', dirent.name),
        }));

    return [...suiteCommonAliases, ...trezorPackagesAliases, ...suiteAliases];
};

export const sharedAliases = [
    {
        find: 'core-js/actual',
        replacement: 'noop-core-js-actual',
    },
    {
        find: 'src',
        replacement: resolve(packageDir, '../suite/src'),
    },
    {
        find: 'crypto',
        replacement: require.resolve('crypto-browserify'),
    },
    {
        find: 'buffer',
        replacement: require.resolve('buffer'),
    },
    {
        find: 'stream',
        replacement: require.resolve('stream-browserify'),
    },
    {
        find: 'vm',
        replacement: require.resolve('vm-browserify'),
    },
    ...createWorkspaceAliases(),
];

// Plugin to provide a no-op replacement for core-js/actual as a virtual module
export const noopCoreJsPlugin = (): Plugin => {
    const virtualModuleId = 'noop-core-js-actual';
    const resolvedVirtualModuleId = '\0' + virtualModuleId;

    return {
        name: 'noop-core-js-actual',
        resolveId(id) {
            if (id === virtualModuleId) {
                return resolvedVirtualModuleId;
            }
        },
        load(id) {
            if (id === resolvedVirtualModuleId) {
                return '// No-op replacement for core-js/actual\nexport default {};';
            }
        },
    };
};
