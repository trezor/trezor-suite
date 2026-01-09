/*
 * Integration tests for library build in `./lib` and `./build` directory
 */

import baseConfig from '../../jest.config.base.js';

export default {
    ...baseConfig,
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: ['**/tests/integration/*.test.ts'],
};
