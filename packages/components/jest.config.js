const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
};
