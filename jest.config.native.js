const babelConfig = {
    presets: [
        'module:metro-react-native-babel-preset',
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript',
        '@babel/preset-react',
    ],
};

module.exports = {
    preset: 'react-native',
    // An array of file extensions your modules use
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: [
        '/node_modules/',
        '/libDev/',
        '/lib/',
        '/dist/',
        '/build/',
        '/build-electron/',
        '/coverage/',
        '/public/',
    ],

    // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
    watchPathIgnorePatterns: ['libDev', 'lib'],

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
