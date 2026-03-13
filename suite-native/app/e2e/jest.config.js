const dotenv = require('dotenv');
const path = require('path');

const nativeJestConfig = require('../../../jest.config.native');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Remove Evolu module mocks from native jest config so e2e tests can use the real packages.
const {
    '^@evolu/common$': _evoluCommon,
    '^@evolu/common/evolu$': _evoluCommonEvolu,
    '^@evolu/react-native/expo-sqlite$': _evoluReactNative,
    ...restModuleNameMapper
} = nativeJestConfig.moduleNameMapper ?? {};

const projectName = process.env.TDR_PROJECT_NAME;
if (!projectName) {
    throw new Error('TDR_PROJECT_NAME environment variable is not defined');
}

const baseReporters = [
    'detox/runners/jest/reporter',
    [
        'jest-junit',
        {
            suiteName: projectName,
            outputDirectory: './reports',
            outputName: `${projectName}-junit-report.xml`,
        },
    ],
];
const githubReporter = './e2e/support/reporter/index.js';
const reporters =
    process.env.PUBLISH_RESULTS_TO_GITHUB === 'true'
        ? [...baseReporters, githubReporter]
        : baseReporters;

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    ...nativeJestConfig,
    moduleNameMapper: restModuleNameMapper,
    rootDir: process.cwd(),
    testTimeout: 120000,
    globalSetup: 'detox/runners/jest/globalSetup',
    globalTeardown: 'detox/runners/jest/globalTeardown',
    transform: {
        ...nativeJestConfig.transform,
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
    },
    reporters,
    testEnvironment: 'detox/runners/jest/testEnvironment',
    verbose: true,
    maxWorkers: 1,
    setupFilesAfterEnv: [
        '<rootDir>/e2e/jest.perTestFile.setup.ts',
        '<rootDir>/e2e/jest.perTestFile.teardown.ts',
    ],
    testMatch: ['<rootDir>/e2e/tests/**/*.test.ts'],
    testPathIgnorePatterns: ['/e2e/tests/manual/'],
    testNamePattern: process.env.TDR_GREP,
};
