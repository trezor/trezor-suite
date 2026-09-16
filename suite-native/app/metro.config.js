/* eslint-disable require-await */

const { withRozenite } = require('@rozenite/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const fs = require('fs');
const { mergeConfig } = require('metro-config');
const path = require('path');

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

// Hermes cannot run WebAssembly, so Cardano Serialization Lib is used through a generated pure-JS
// (asm.js) build reduced to what coin selection needs; see
// networks/cardano/network-cardano/scripts/csl-asmjs/generate.js (runs on postinstall of this app).
const cardanoSerializationLibPath = path.resolve(
    __dirname,
    '../../networks/cardano/network-cardano/generated/csl-asmjs/cardano_serialization_lib.js',
);

// The generated file is a multi-megabyte single module. Metro transforms it in one worker, which
// runs out of the default V8 heap (about 4.5 GB; the transform peaks above 5 GB). Worker threads
// created after this call inherit the raised limit; the main process keeps its default. It is a
// cap, not an allocation.
require('v8').setFlagsFromString('--max-old-space-size=12288');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    transformer: {
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

            if (
                moduleName === '@emurgo/cardano-serialization-lib-nodejs' ||
                moduleName === '@emurgo/cardano-serialization-lib-browser'
            ) {
                // `@fivebinaries/coin-selection` imports the WASM build of Cardano Serialization
                // Lib. Route both variants it references to the generated asm.js build. The glue
                // needs a global `TextDecoder`, which the Expo runtime polyfills.
                if (!fs.existsSync(cardanoSerializationLibPath)) {
                    throw new Error(
                        'Generated Cardano Serialization Lib build is missing. Run `yarn install` ' +
                            'or `yarn workspace @trezor/network-cardano generate:csl-asmjs`.',
                    );
                }

                return { filePath: cardanoSerializationLibPath, type: 'sourceFile' };
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
