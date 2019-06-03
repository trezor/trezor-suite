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
/* eslint-enable */

// TODO: multiple webpack entrypoints  https://github.com/zeit/next.js/issues/774
module.exports = {
    projectRoot: path.resolve(__dirname, '../../'),
    transformer: {
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
        },
        // https://github.com/facebook/metro/issues/265
        blacklistRE: blacklist([
            /packages\/components-storybook\/node_modules\/react-native\/.*/,
            /node_modules\/.*\/node_modules\/react-native\/.*/,
        ]),
    },
};
