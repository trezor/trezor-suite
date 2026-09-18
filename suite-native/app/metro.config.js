/* eslint-disable require-await */

const { withRozenite } = require('@rozenite/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
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

// `jwa` is the signing backend of `jws`, which verifies the firmware release config and the
// message-system config during app startup. Hermes has no JIT, so the elliptic-curve math in
// crypto-browserify takes hundreds of milliseconds per verification, while
// react-native-quick-crypto runs it in native OpenSSL. Scoped to `jwa` instead of aliasing
// `crypto` globally, because the rest of the bundle is only tested against crypto-browserify.
const jwaPackagePath = path.join(path.sep, 'node_modules', 'jwa', path.sep);

const isRequestedByJwa = context => context.originModulePath.includes(jwaPackagePath);

// Hermes cannot run WASM; see networks/cardano/network-cardano/README.md.
const cardanoSerializationLibPath = path.resolve(
    __dirname,
    '../../networks/cardano/network-cardano/generated/csl-asmjs/cardano_serialization_lib.js',
);

// Transforming the multi-megabyte Cardano Serialization Lib asm.js file exceeds the default worker
// heap (4.5 GB). Worker threads created after this call inherit the cap; memory is allocated only
// as needed, not reserved up front.
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

            if (moduleName === 'crypto' && isRequestedByJwa(context)) {
                return context.resolveRequest(context, 'react-native-quick-crypto', platform);
            }

            const getSourceFile = filePath => ({
                filePath: require.resolve(filePath),
                type: 'sourceFile',
            });

            if (
                moduleName === '@emurgo/cardano-serialization-lib-nodejs' ||
                moduleName === '@emurgo/cardano-serialization-lib-browser'
            ) {
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
