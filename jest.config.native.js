const {
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
} = require('./jest.config.base');

const babelConfig = {
    presets: [
        'module:metro-react-native-babel-preset',
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript',
        '@babel/preset-react',
    ],
};

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,

    preset: 'react-native',

    transform: {
        '\\.(js|jsx|ts|tsx)$': ['babel-jest', babelConfig],
        '^.+\\.jsx?$': '<rootDir>/../../node_modules/react-native/jest/preprocessor.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@react-native|react-native|react-navigation|react-native-reanimated|@react-navigation|@shopify|react-navigation-tabs|react-navigation-redux-helpers|react-native-safari-view|react-native-linear-gradient|react-native-blur|react-native-animatable|react-native-wkwebview-reborn|react-native-safe-area-view|react-native-popup-menu|redux-persist)/)',
    ],
    setupFiles: [
        '<rootDir>/../../node_modules/@shopify/react-native-skia/jestSetup.js',
        '<rootDir>/../../node_modules/react-native-gesture-handler/jestSetup.js',
        '<rootDir>/../../suite-native/test-utils/src/setupReactNavigationMock.js',
    ],
};
