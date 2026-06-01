const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock'],
    setupFilesAfterEnv: ['<rootDir>/../../packages/suite/jest.setup.js'],
    moduleNameMapper: {
        '\\.(svg)$': '<rootDir>/../../packages/suite/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
};
