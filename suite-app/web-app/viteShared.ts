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
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite/${dirent.name}`,
            replacement: resolve(packageDir, '../../suite', dirent.name),
        }));

    // Without an alias a workspace package is reached through node_modules, which Vite pre-bundles
    // as a dependency in a separate pass. That pass gets its own copy of every module it imports, so
    // a React context created in @trezor/dependency-injection would exist twice and the provider
    // and its consumers would not see each other.
    const suiteAppAliases = readdirSync(resolve(packageDir, '..'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
            find: `@suite-app/${dirent.name}`,
            replacement: resolve(packageDir, '..', dirent.name),
        }));

    return [
        // The `./pages/*` export of each @suite-app/module-* package points into `src`, which a
        // plain prefix alias would miss, so it is matched before the package alias.
        {
            find: /^@suite-app\/(module-[\w-]+)\/pages\/(.*)$/,
            replacement: `${resolve(packageDir, '..')}/$1/src/pages/$2`,
        },
        ...suiteCommonAliases,
        ...trezorPackagesAliases,
        ...suiteAliases,
        ...suiteAppAliases,
    ];
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
        // Mirrors the webpack config: coin selection runs the asm.js build of Cardano Serialization Lib.
        find: /^@emurgo\/cardano-serialization-lib-(nodejs|browser)$/,
        replacement: resolve(
            packageDir,
            '../../networks/cardano/network-cardano/generated/csl-asmjs/cardano_serialization_lib.js',
        ),
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
