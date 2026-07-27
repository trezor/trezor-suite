const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    setupFiles: ['jest-canvas-mock'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '\\.(svg|webp)$': '<rootDir>/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
};
