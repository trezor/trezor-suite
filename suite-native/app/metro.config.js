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

            if (moduleName === '@sinclair/typebox' || moduleName.startsWith('@sinclair/typebox/')) {
                // TypeBox subpaths ('./value', './errors') resolve to the CJS build while the
                // package root resolves to ESM, which puts two TypeBox instances in the bundle.
                // Custom kinds registered in one instance's `TypeRegistry` are then invisible to
                // the validator from the other one. Pin the whole package to the CJS build.
                // See: https://github.com/expo/expo/issues/37171
                return context.resolveRequest(
                    { ...context, isESMImport: false },
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
