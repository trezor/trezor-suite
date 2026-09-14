const baseConfig = require('../../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock'],
    setupFilesAfterEnv: ['<rootDir>/../../../packages/suite/jest.setup.js'],
    roots: ['<rootDir>/src', '<rootDir>/../../../suite-common/test-utils/__mocks__'],
    moduleNameMapper: {
        '\\.(svg|webp)$': '<rootDir>/../../../packages/suite/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
};
