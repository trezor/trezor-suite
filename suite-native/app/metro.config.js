/* eslint-disable require-await */

const { withRozenite } = require('@rozenite/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { mergeConfig } = require('metro-config');

const { metroSecureResolver } = require('@trezor/bundler-security/src/metroSecureResolver');

// Learn more https://docs.expo.io/guides/customizing-metro

const jsonExpoConfig = getSentryExpoConfig(__dirname);
const defaultSourceExts = [...jsonExpoConfig.resolver.sourceExts, 'md'];
const additionalSourceExts = process.env.RN_SRC_EXT ? process.env.RN_SRC_EXT.split(',') : [];
const sourceExts = [...additionalSourceExts, ...defaultSourceExts];

// Packages whose ESM build Metro would pick via `exports`, but which we need to resolve to
// their CommonJS build instead.
const cjsOnlyPackages = [
    // Subpaths ('./value', './errors') resolve to CJS while the package root resolves to ESM,
    // so two TypeBox instances end up in the bundle. Custom kinds registered in one instance's
    // `TypeRegistry` are then invisible to the validator from the other one.
    // See https://github.com/expo/expo/issues/37171
    '@sinclair/typebox',
    // Its ESM `FileMigrationProvider` calls `await import()` with a computed specifier, which
    // Hermes refuses to compile ('Invalid expression encountered'). The CJS build emits a plain
    // `require()` there.
    'kysely',
    // Its ESM and CJS entry points load disjoint chunks (`*.require.js` vs `*.require.cjs`), so
    // the `require()` in `./rozeniteBootRecording` and the `import` in `useRozenitePlugins` would
    // each get their own copy of the plugin's module state. Boot recording would then patch
    // `globalThis.fetch` in one copy while the DevTools hook reads the other one's empty event
    // queue.
    '@rozenite/network-activity-plugin',
];

// Packages that predate `exports` and mirror their subpath map into the `browser` field using
// deep paths (`"./basics": "./cjs/src/basics.js"`). Metro applies that redirect before it
// validates the result against `exports`, where the deep path is never listed, so every import
// logs a "not listed in the exports" warning and then falls back to file-based resolution.
// Resolving them without `exports`, the way we did before package exports were enabled, keeps
// the `browser` targets these packages intend for us.
const legacyBrowserFieldPackages = [
    'uint8arrays',
    // Its `exports` resolves `./hashes/sha2` to a build that requires Node's `crypto`, while
    // `browser` points at the WebCrypto one.
    'multiformats',
    '@noble/hashes',
];

const isModuleFrom = (packageNames, moduleName) =>
    packageNames.some(
        packageName => moduleName === packageName || moduleName.startsWith(`${packageName}/`),
    );

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
// The asm.js build of Cardano Serialization Lib is a single ~37 MB source file. Transforming it
// exceeds the default V8 heap of a Metro worker (release bundling peaked at ~8.5 GB), so workers
// run as child processes (instead of worker threads, which cannot get their own heap limit) with
// a larger heap. The value is a cap, not an allocation; only the worker handling that file uses it.
const METRO_WORKER_NODE_OPTIONS = '--max-old-space-size=12288';
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, METRO_WORKER_NODE_OPTIONS]
    .filter(Boolean)
    .join(' ');

const config = {
    transformer: {
        unstable_workerThreads: false,
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
    resolver: {
        blockList: [/libDev/],
        extraNodeModules: {
            // modules needed for trezor-connect
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            https: require.resolve('https-browserify'),
            http: require.resolve('stream-http'),
            zlib: require.resolve('browserify-zlib'),
            vm: require.resolve('vm-browserify'),
            // modules needed by ElectrumWorker
            net: require.resolve('react-native-tcp-socket'),
            tls: require.resolve('react-native-tcp-socket'),
        },
        sourceExts,
        resolveRequest: (context, moduleName, platform) => {
            metroSecureResolver({
                moduleName,
                originModulePath: context.originModulePath,
            });

            if (isModuleFrom(cjsOnlyPackages, moduleName)) {
                return context.resolveRequest(
                    { ...context, isESMImport: false },
                    moduleName,
                    platform,
                );
            }

            if (isModuleFrom(legacyBrowserFieldPackages, moduleName)) {
                return context.resolveRequest(
                    { ...context, unstable_enablePackageExports: false },
                    moduleName,
                    platform,
                );
            }

            const getSourceFile = filePath => ({
                filePath: require.resolve(filePath),
                type: 'sourceFile',
            });

            if (moduleName.startsWith('@emurgo/cardano-serialization-lib')) {
                // Cardano coin selection (`@fivebinaries/coin-selection`) imports the WASM build of
                // Cardano Serialization Lib, which Hermes cannot execute. Route every variant
                // (nodejs/browser) to the pure-JS asm.js build of the same CSL version instead.
                // The asm.js package has no `main` field, so the entry file is resolved explicitly.
                // It needs a global `TextDecoder`, which the Expo runtime polyfills.
                return getSourceFile(
                    '@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js',
                );
            }

            if (process.env.EXPO_PUBLIC_IS_DETOX_BUILD && moduleName === '@trezor/connect') {
                // Mock some Trezor Connect methods to avoid network flakiness during e2e tests.
                return getSourceFile('./e2e/mocks/trezor-connect.js');
            }

            // Optionally, chain to the standard Metro resolver.
            return context.resolveRequest(context, moduleName, platform);
        },
    },
};

const configWithStorybook = mergeConfig(
    jsonExpoConfig,
    withStorybook(config, {
        enabled: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
        configPath: './../storybook/.rnstorybook',
    }),
);

let exportedConfig = configWithStorybook;

if (
    process.env.EXPO_PUBLIC_IS_DETOX_BUILD !== 'true' &&
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug'
) {
    // enable Rozenite plugins only in debug build
    exportedConfig = withRozenite(configWithStorybook, {
        enabled: true,
    });
}

module.exports = exportedConfig;
