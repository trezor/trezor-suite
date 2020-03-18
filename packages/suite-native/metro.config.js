/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');
const nodejs = require('node-libs-browser');

const { getDefaultConfig } = require('metro-config');

/* eslint-enable */

module.exports = (async () => {
    const {
        resolver: { sourceExts, assetExts },
    } = await getDefaultConfig();
    return {
        projectRoot: path.resolve(__dirname, '../../'),
        transformer: {
            babelTransformerPath: require.resolve('react-native-svg-transformer'),
            getTransformOptions: async () => ({
                transform: {
                    experimentalImportSupport: false,
                    inlineRequires: false,
                },
            }),
        },
        resolver: {
            resolverMainFields: ['react-native', 'browser', 'main'],
            extraNodeModules: {
                crypto: nodejs.crypto,
                stream: nodejs.stream,
                path: nodejs.path,
                vm: nodejs.vm,
                '@trezor/blockchain-link': path.resolve(
                    __dirname,
                    '../../packages/blockchain-link',
                ),
            },
            // https://github.com/facebook/metro/issues/265
            blacklistRE: blacklist([
                /packages\/.*\/node_modules\/react-native\/.*/, // ignores react-native dependency in each package; suite relies on react-native hoisted to root node_modules folder
                /node_modules\/.*\/node_modules\/react-native\/.*/,
            ]),
            assetExts: assetExts.filter(ext => ext !== 'svg'),
            sourceExts: [...sourceExts, 'svg'],
        },
    };
})();
