const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFiles: ['jest-canvas-mock', ...baseConfig.setupFiles],
    setupFilesAfterEnv: ['<rootDir>/../../packages/suite/jest.setup.js'],
    moduleNameMapper: {
        '\\.(svg|webp)$': '<rootDir>/../../packages/suite/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
};
