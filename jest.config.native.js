const {
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
    moduleNameMapper,
} = require('./jest.config.base');

process.env.EXPO_OS ??= 'ios';

const babelConfig = {
    presets: ['babel-preset-expo'],
    caller: {
        name: 'metro',
        bundler: 'metro',
        platform: process.env.EXPO_OS,
    },
};

const swcConfig = require('./jest.config.swc-transform');

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions,
    testMatch,
    testPathIgnorePatterns,
    watchPathIgnorePatterns,
    moduleNameMapper: {
        ...moduleNameMapper,
        '^@evolu/common$': `${__dirname}/suite-native/test-utils/src/mocks/evoluMock.ts`,
        '^@evolu/common/evolu$': `${__dirname}/suite-native/test-utils/src/mocks/evoluMock.ts`,
        '^@evolu/react-native$': `${__dirname}/suite-native/test-utils/src/mocks/evoluMock.ts`,
        '^@evolu/react-native/expo-sqlite$': `${__dirname}/suite-native/test-utils/src/mocks/evoluMock.ts`,
        '^(@formatjs/[^/]+)/(polyfill|locale-data/.+)$': `${__dirname}/node_modules/$1/$2`,
    },
    testEnvironment: 'jsdom',
    preset: 'jest-expo',
    // SWC has no Flow support; React Native source in node_modules (allowed through
    // transformIgnorePatterns) ships Flow types, so .js/.jsx must go through babel.
    // Inspiration from GH issue comment: https://github.com/swc-project/jest/issues/85#issuecomment-1122482982
    transform: {
        '\\.(ts|tsx)$': ['@swc/jest', swcConfig],
        '\\.(js|jsx)$': ['babel-jest', babelConfig],
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia|@shopify/flash-list|@noble|@scure|@evolu|kysely|random|nanoid|msgpackr|@gorhom|uuid|react-intl|@formatjs/*|intl-messageformat)',
    ],
    setupFiles: [
        `${__dirname}/suite-native/test-utils/src/mocks/reanimatedMock.js`,
        `${__dirname}/suite-native/test-utils/src/mocks/expoAndRNMock.jsx`,
        `${__dirname}/suite-native/test-utils/src/mocks/everstakeJestSetup.js`,
        `${__dirname}/suite-native/test-utils/src/mocks/TextEncoderMock.js`,
        `${__dirname}/suite-native/test-utils/src/mocks/randomUUIDMock.js`,
        `${__dirname}/node_modules/@shopify/react-native-skia/jestSetup.js`,
        `${__dirname}/node_modules/@shopify/flash-list/jestSetup.js`,
        `${__dirname}/node_modules/react-native-gesture-handler/jestSetup.js`,
        `${__dirname}/suite-native/firmware/src/jestSetup.js`,
        `${__dirname}/suite-native/connection-status/src/jestSetup.js`,
        `${__dirname}/suite-native/react-native-graph/src/jestSetup.js`,
        `${__dirname}/suite-native/atoms/src/jestSetup.jsx`,
        `${__dirname}/suite-native/module-trading/src/jest.setup.tsx`,
        `${__dirname}/suite-native/trading-quote-utils/src/jest.setup.tsx`,
        `${__dirname}/suite-native/module-connect-popup/src/jest.setup.ts`,
        `${__dirname}/suite-native/module-device-onboarding/src/jest.setup.ts`,
        `${__dirname}/suite-native/config/src/jest.setup.ts`,
        `${__dirname}/suite-native/intl/src/jest.setup.ts`,
    ],
};
