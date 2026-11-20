'use strict';
const path = require('node:path');

const root = process.env.IOS_IMPORT_ONLY_REPO_ROOT || path.resolve(process.cwd(), '../..');
process.env.TDR_PROJECT_NAME = 'import-only';
process.env.EXPO_OS = 'ios';
const original = require(path.join(root, 'suite-native-app/app/e2e/jest.config.js'));
module.exports = {
    ...original,
    rootDir: path.join(root, 'suite-native-app/app'),
    testEnvironment: 'jest-environment-node',
    globalSetup: undefined,
    globalTeardown: undefined,
    setupFilesAfterEnv: [path.join(__dirname, 'ios-import-only-native-setup.cjs')],
    testNamePattern: '^__intentionally_no_tests_match__$',
    reporters: ['default', path.join(__dirname, 'ios-import-only-reporter.cjs')],
    cacheDirectory: process.env.IOS_IMPORT_ONLY_JEST_CACHE || path.join(__dirname, 'ios-import-only-native-node-jest-cache'),
    maxWorkers: 1,
    collectCoverage: false,
};
