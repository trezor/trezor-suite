const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.svg$': '<rootDir>/__mocks__/fileMock.js',
    },
};
