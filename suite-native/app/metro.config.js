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

const cjsOnlyPackages = ['@sinclair/typebox', 'kysely'];

const legacyBrowserFieldPackages = ['uint8arrays', 'multiformats', '@noble/hashes'];

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

            // Packages whose ESM build Metro would pick via `exports`, but which we need to
            // resolve to their CommonJS build instead:
            // - `@sinclair/typebox`: subpaths ('./value', './errors') resolve to CJS while the
            //   package root resolves to ESM, so two TypeBox instances end up in the bundle.
            //   Custom kinds registered in one instance's `TypeRegistry` are then invisible to
            //   the validator from the other one. See https://github.com/expo/expo/issues/37171
            // - `kysely`: its ESM `FileMigrationProvider` calls `await import()` with a computed
            //   specifier, which Hermes refuses to compile ('Invalid expression encountered').
            //   The CJS build emits a plain `require()` there.
            if (isModuleFrom(cjsOnlyPackages, moduleName)) {
                return context.resolveRequest(
                    { ...context, isESMImport: false },
                    moduleName,
                    platform,
                );
            }

            // Packages that predate `exports` and mirror their subpath map into the `browser`
            // field using deep paths (`"./basics": "./cjs/src/basics.js"`). Metro applies that
            // redirect before it validates the result against `exports`, where the deep path is
            // never listed, so every import logs a "not listed in the exports" warning and then
            // falls back to file-based resolution.
            // Resolving them without `exports`, the way we did before package exports were
            // enabled, keeps the `browser` targets these packages intend for us - `multiformats`'
            // `exports` resolves `./hashes/sha2` to a build that requires Node's `crypto`, while
            // `browser` points at the WebCrypto one.
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

            if (moduleName.startsWith('@emurgo/cardano')) {
                // Cardano libs doesn't have main field in package.json which will cause error in metro
                // Also they use WASM which doesn't work in RN so we polyfill it with empty file to build errors
                // In future we will need JS implementation of Cardano libs or C++ implementation
                return getSourceFile('./cardanoPolyfills.js');
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
