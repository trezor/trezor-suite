/**
 * Jest configuration for web packages.
 * Keeping this file next to the package.json file instead of providing configuration
 * with `-c ../../jest.config.base` option in package.json scripts
 * allows us to run jest tests directly from IDEs.
 */
const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    // jsdom lacks TextEncoder/TextDecoder, which the network modules composed by
    // `@suite-common/networks` reach for at import time.
    setupFiles: ['../../suite-common/test-utils/src/jsdomGlobalPolyfills.js'],
};
