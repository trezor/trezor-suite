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
