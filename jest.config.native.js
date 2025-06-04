const {
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
    moduleNameMapper,
} = require('./jest.config.base');

const babelConfig = {
    presets: ['babel-preset-expo'],
};

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
    moduleNameMapper,
    testEnvironment: 'jsdom',
    preset: 'jest-expo',

    transform: {
        '\\.(js|jsx|ts|tsx)$': ['babel-jest', babelConfig],
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia)',
    ],
    setupFiles: [
        '<rootDir>/../../node_modules/@shopify/react-native-skia/jestSetup.js',
        '<rootDir>/../../node_modules/@shopify/flash-list/jestSetup.js',
        '<rootDir>/../../node_modules/react-native-gesture-handler/jestSetup.js',
        '<rootDir>/../../suite-native/test-utils/src/everstakeJestSetup.js',
        '<rootDir>/../../suite-native/test-utils/src/expoMock.js',
        '<rootDir>/../../suite-native/test-utils/src/TextEncoderMock.js',
        '<rootDir>/../../suite-native/firmware/src/jestSetup.js',
        '<rootDir>/../../suite-native/connection-status/src/jestSetup.js',
        '<rootDir>/../../suite-native/react-native-graph/src/jestSetup.js',
        '<rootDir>/../../suite-native/atoms/src/jestSetup.jsx',
        '<rootDir>/../../suite-native/analytics/src/jest.setup.ts',
        '<rootDir>/../../suite-native/module-trading/src/jest.setup.tsx',
        '<rootDir>/../../suite-native/module-connect-popup/src/jest.setup.ts',
    ],
};
