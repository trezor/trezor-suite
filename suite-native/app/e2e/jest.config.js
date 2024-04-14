const nativeJestConfig = require('../../../jest.config.native');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
    ...nativeJestConfig,
    rootDir: '..',
    testTimeout: 120000,
    globalSetup: 'detox/runners/jest/globalSetup',
    globalTeardown: 'detox/runners/jest/globalTeardown',
    reporters: ['detox/runners/jest/reporter'],
    testEnvironment: 'detox/runners/jest/testEnvironment',
    verbose: true,
    maxWorkers: 1,
};
