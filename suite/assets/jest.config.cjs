const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/jest.setup.cjs', 'jest-canvas-mock'],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.(svg|webp)$': '<rootDir>/../../packages/suite/__mocks__/import-svg.js',
    },
};
