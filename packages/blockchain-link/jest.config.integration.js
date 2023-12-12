/*
 * Integration tests for library build in `./lib` and `./build` directory
 */

const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: ['**/tests/integration/*.ts'],
};
