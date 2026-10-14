const base = require('../../../jest.config.cjs');

module.exports = {
    ...base,
    testEnvironment: '../../../jest/JestCustomEnv.js',
};
