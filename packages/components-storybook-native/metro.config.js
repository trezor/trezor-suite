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
        /packages\/.*\/node_modules\/react-native\/.*/, // ignores react-native dependency in each package; suite relies on react-native hoisted to root node_modules folder
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
