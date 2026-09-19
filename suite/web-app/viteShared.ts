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

    const trezorPackagesAliases = readdirSync(resolve(packageDir, '../../packages'), {
        withFileTypes: true,
    })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@trezor/${dirent.name}`,
            replacement: resolve(packageDir, '../../packages', dirent.name),
        }));

    const suiteAliases = readdirSync(resolve(packageDir, '../../suite'), { withFileTypes: true })
        // web-app is the application root itself, aliasing it to @suite/web-app would be circular
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'web-app')
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
        // Mirrors the webpack config: resolve CJS lodash imports (recharts') to the ESM build.
        find: 'lodash',
        replacement: 'lodash-es',
    },
    {
        find: 'src',
        replacement: resolve(packageDir, '../../packages/suite/src'),
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
    // Kept in step with the webpack config so the light lottie player is what dev and the component
    // gallery render too -- otherwise an animation using expressions or a non-svg renderer would
    // work here and break only in the shipped build. Anchored, so the deep import below the alias
    // still resolves.
    {
        find: /^lottie-web$/,
        replacement: require.resolve('lottie-web/build/player/lottie_light'),
    },
    {
        find: /^lottie-react$/,
        replacement: require.resolve('lottie-react/build/index.es.js'),
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
