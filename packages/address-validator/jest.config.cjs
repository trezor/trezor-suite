const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    transformIgnorePatterns: ['/node_modules/(?!@scure/base/)'],
};
