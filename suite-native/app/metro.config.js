/* eslint-disable require-await */
const { mergeConfig } = require('@react-native/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const nodejs = require('node-libs-browser');

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
        blockList: [/libDev/],
        extraNodeModules: {
            // modules needed for trezor-connect
            crypto: nodejs.crypto,
            stream: nodejs.stream,
            https: nodejs.https,
            http: nodejs.http,
            zlib: nodejs.zlib,
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

            if (process.env.IS_DETOX_BUILD && moduleName === '@trezor/connect') {
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
module.exports = mergeConfig(jsonExpoConfig, config);
