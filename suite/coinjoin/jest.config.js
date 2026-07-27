const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    // extra root: the @trezor/connect manual mock used by the store-integration tests
    roots: ['<rootDir>/src', '<rootDir>/../../suite-common/test-utils/__mocks__'],
    setupFiles: ['jest-canvas-mock'],
    setupFilesAfterEnv: ['<rootDir>/../../packages/suite/jest.setup.js'],
    moduleNameMapper: {
        '\\.(svg|webp)$': '<rootDir>/../../packages/suite/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
};
