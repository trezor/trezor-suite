const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    setupFiles: ['jest-canvas-mock', ...baseConfig.setupFiles],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.svg$': '<rootDir>/__mocks__/fileMock.js',
    },
};
