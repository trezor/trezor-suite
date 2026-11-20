const dotenv = require('dotenv');
const path = require('path');

const nativeJestConfig = require('../../../jest.config.native');

dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
    rootDir: '..',
    preset: 'jest-expo',
    testEnvironment: 'node',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia|uuid)',
    ],
    transform: {
        ...nativeJestConfig.transform,
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
    },
    verbose: true,
    reporters: ['<rootDir>/e2e/support/reporter/index.js'],
    // In reporter-watchdog mode the synthetic manual specs live in their own reporter-watchdog/ folder instead.
    testMatch:
        process.env.REPORTER_WATCHDOG === 'true'
            ? ['<rootDir>/e2e/reporter-watchdog/**/*.test.ts']
            : ['<rootDir>/e2e/tests/manual/**/*.test.ts'],
};
