/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');
/* eslint-enable */

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
        blacklistRE: blacklist([
            /suite-native\/node_modules\/react-native\/.*/,
            /android\/.*/,
            /ios\/.*/,
        ]),
    },
};
