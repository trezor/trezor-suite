/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require('path');
const blacklist = require('metro-config/src/defaults/blacklist');



module.exports = {
  projectRoot: path.resolve(__dirname, '../../'),
  resolver: {
    blacklistRE: blacklist([
        /packages\/components-storybook\/node_modules\/react-native\/.*/,
        /packages\/componentsStorybookNative\/node_modules\/react-native\/.*/,
        /node_modules\/.*\/node_modules\/react-native\/.*/,
    ]),
},
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
