const reanimatedResolver = require('react-native-reanimated/jest/resolver');

module.exports = (request, options) =>
    options.basedir.includes('/react-native-reanimated/') ||
    options.basedir.includes('/react-native-worklets/')
        ? reanimatedResolver(request, options)
        : options.defaultResolver(request, options);
