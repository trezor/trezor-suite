/* eslint-disable require-await */
const nodejs = require('node-libs-browser');
// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { mergeConfig } = require('@react-native/metro-config');

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
        resolveRequest: (context, moduleName, platform) => {
            // index 0 refers to suite-native/app node_modules directory
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

            // Optionally, chain to the standard Metro resolver.
            return context.resolveRequest(context, moduleName, platform);
        },
    },
};
module.exports = mergeConfig(getSentryExpoConfig(__dirname), config);
