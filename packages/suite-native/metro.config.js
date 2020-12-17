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
                // TODO: needed for google-aut-library (same thing is in suite-web/desktop)
                // Find more reasonable solution than setting all missing libs to nodejs.path (null doesn't work)
                // Or just use other auth client that doesn't bundle those things since we are not using that part of the lib anyway?
                os: nodejs.os,
                fs: nodejs.path,
                child_process: nodejs.path,
                net: nodejs.path,
                tls: nodejs.path,
                '@trezor/blockchain-link': path.resolve(
                    __dirname,
                    '../../packages/blockchain-link',
                ),
                '@trezor/rollout': path.resolve(__dirname, '../../packages/rollout'),
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
