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
    workerIdleMemoryLimit: '1024MB',
    moduleNameMapper: {
        ...moduleNameMapper,
        '^@evolu/common$': '<rootDir>/../../suite-native/test-utils/src/mocks/evoluMock.ts',
        '^@evolu/common/evolu$': '<rootDir>/../../suite-native/test-utils/src/mocks/evoluMock.ts',
        '^@evolu/react-native$': '<rootDir>/../../suite-native/test-utils/src/mocks/evoluMock.ts',
        '^@evolu/react-native/expo-sqlite$':
            '<rootDir>/../../suite-native/test-utils/src/mocks/evoluMock.ts',
        '^(@formatjs/[^/]+)/(polyfill|locale-data/.+)$': '<rootDir>/../../node_modules/$1/$2.js',
        '^@rozenite/redux-devtools-plugin$':
            '<rootDir>/../../suite-native/test-utils/src/mocks/rozeniteReduxDevtoolsPluginMock.ts',
    },
    testEnvironment: 'jsdom',
    preset: 'jest-expo',

    transform: {
        '\\.(js|jsx|ts|tsx)$': ['babel-jest', babelConfig],
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia|@shopify/flash-list|@noble|@scure|@evolu|nanoid|msgpackr|@gorhom|uuid|react-intl|@formatjs/*|intl-messageformat)',
    ],
    setupFiles: [
        '<rootDir>/../../suite-native/test-utils/src/mocks/expoAndRNMock.jsx',
        '<rootDir>/../../suite-native/test-utils/src/mocks/everstakeJestSetup.js',
        '<rootDir>/../../suite-native/test-utils/src/mocks/TextEncoderMock.js',
        '<rootDir>/../../suite-native/test-utils/src/mocks/nativeServicesJestSetup.ts',
        '<rootDir>/../../node_modules/@shopify/react-native-skia/jestSetup.js',
        '<rootDir>/../../node_modules/@shopify/flash-list/jestSetup.js',
        '<rootDir>/../../node_modules/react-native-gesture-handler/jestSetup.js',
        '<rootDir>/../../suite-native/firmware/src/jestSetup.js',
        '<rootDir>/../../suite-native/connection-status/src/jestSetup.js',
        '<rootDir>/../../suite-native/react-native-graph/src/jestSetup.js',
        '<rootDir>/../../suite-native/atoms/src/jestSetup.jsx',
        '<rootDir>/../../suite-native/module-trading/src/jest.setup.tsx',
        '<rootDir>/../../suite-native/module-connect-popup/src/jest.setup.ts',
        '<rootDir>/../../suite-native/module-device-onboarding/src/jest.setup.ts',
        '<rootDir>/../../suite-native/config/src/jest.setup.ts',
        '<rootDir>/../../suite-native/intl/src/jest.setup.ts',
    ],
};
