/* eslint-disable require-await */

const { withRozenite } = require('@rozenite/metro');
const { withRozeniteReduxDevTools } = require('@rozenite/redux-devtools-plugin/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
const { mergeConfig } = require('metro-config');

const { metroSecureResolver } = require('@trezor/bundler-security/src/metroSecureResolver');

// Learn more https://docs.expo.io/guides/customizing-metro

const jsonExpoConfig = getSentryExpoConfig(__dirname);
const defaultSourceExts = jsonExpoConfig.resolver.sourceExts;
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
        unstable_enablePackageExports: false,
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

            // web3-validator package handling
            const rootNodeModulesPath = context.nodeModulesPaths[1];

            // web3-validator package is by default trying to use non-existing minified index file. This fixes that.
            // Can be removed once web3-validator fixup PR is merged: https://github.com/web3/web3.js/pull/7016.
            if (moduleName.startsWith('web3-validator')) {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath + '/web3-validator/lib/commonjs/index.js',
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName.startsWith('@emurgo/cardano')) {
                // Cardano libs doesn't have main field in package.json which will cause error in metro
                // Also they use WASM which doesn't work in RN so we polyfill it with empty file to build errors
                // In future we will need JS implementation of Cardano libs or C++ implementation
                return {
                    filePath: require.resolve('./cardanoPolyfills.js'),
                    type: 'sourceFile',
                };
            }

            // tiny-secp256k1 used by @trezor/utxo-lib is terribly slow because WASM is not supported.
            // @bitcoinerlab/secp256k1 is approximately 5× faster but requires additional tweaking.
            if (moduleName === 'tiny-secp256k1') {
                return {
                    filePath: require.resolve('./secp256k1Shim.js'),
                    type: 'sourceFile',
                };
            }

            // Todo: This is hack because of the `unstable_enablePackageExports: false`.
            //       See: https://github.com/trezor/trezor-suite/issues/20733
            if (moduleName === '@evolu/react-native/expo-sqlite') {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath +
                            `/@evolu/react-native/dist/src/exports/expo-sqlite.js`,
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName === '@evolu/react-native') {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath + `/@evolu/react-native/dist/src/index.js`,
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName === '@evolu/common') {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath + `/@evolu/common/dist/src/index.js`,
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName === '@evolu/common/evolu') {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath + `/@evolu/common/dist/src/Evolu/Internal.js`,
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName === '@evolu/common/local-first') {
                return {
                    filePath: require.resolve(
                        rootNodeModulesPath + `/@evolu/common/dist/src/local-first/index.js`,
                    ),
                    type: 'sourceFile',
                };
            }

            if (moduleName === 'uuid') {
                return {
                    filePath: require.resolve(rootNodeModulesPath + '/uuid/dist/index.js'),
                    type: 'sourceFile',
                };
            }
            // Todo: ----- End of hack -----

            if (process.env.EXPO_PUBLIC_IS_DETOX_BUILD && moduleName === '@trezor/connect') {
                // Mock some Trezor Connect methods to avoid network flakiness during e2e tests.
                return {
                    filePath: require.resolve('./e2e/mocks/trezor-connect.js'),
                    type: 'sourceFile',
                };
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

if (
    process.env.EXPO_PUBLIC_IS_DETOX_BUILD !== 'true' &&
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'debug'
) {
    // enable Rozenite plugins only in debug build
    module.exports = withRozenite(configWithStorybook, {
        enhanceMetroConfig: originalConfig => withRozeniteReduxDevTools(originalConfig),
        enabled: true,
    });
} else {
    module.exports = configWithStorybook;
}
