const dotenv = require('dotenv');
const path = require('path');

const nativeJestConfig = require('../../../jest.config.native');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseReporters = [
    'detox/runners/jest/reporter',
    ['jest-junit', { outputDirectory: './reports', outputName: 'junit-report.xml' }],
];
const githubReporter = './e2e/support/reporter/index.js';
const reporters =
    process.env.PUBLISH_RESULTS_TO_GITHUB === 'true'
        ? [...baseReporters, githubReporter]
        : baseReporters;

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    ...nativeJestConfig,
    rootDir: '..',
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
    setupFilesAfterEnv: ['<rootDir>/e2e/jest.setup.ts'],
    testMatch: ['<rootDir>/e2e/tests/**/*.test.ts'],
    testPathIgnorePatterns: ['/e2e/tests/manual/'],
};
