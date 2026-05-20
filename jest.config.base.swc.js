const path = require('path');

const swcConfig = require('./jest.config.swc-transform');

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],

    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

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

    transform: {
        '\\.(js|jsx|ts|tsx)$': ['@swc/jest', swcConfig],
    },

    transformIgnorePatterns: ['node_modules/?!(uuid|react-intl|@formatjs/*|intl-messageformat)/'],

    watchPathIgnorePatterns: ['libDev', 'lib'],

    modulePathIgnorePatterns: ['libDev'],
    moduleNameMapper: {
        '^reselect$': path.resolve(__dirname, 'suite-native/test-utils/src/mocks/reselectMock.ts'),
        '^bcrypto/lib/(.*)$': 'bcrypto/lib/$1-browser',
        '^uint8array-tools$': require.resolve('uint8array-tools'),
        '^usb$': '<rootDir>../../packages/transport/mocks/usb.js',
    },
};
