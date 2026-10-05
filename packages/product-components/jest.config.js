const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    setupFiles: ['jest-canvas-mock'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.(svg|webp|png|jpg)$': '<rootDir>/__mocks__/fileMock.js',
    },
};
