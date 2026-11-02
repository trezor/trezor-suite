const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    // jsdom lacks TextEncoder/TextDecoder, which the network modules composed by
    // `@suite-common/networks` reach for at import time.
    setupFiles: ['../../suite-common/test-utils/src/jsdomGlobalPolyfills.js'],
};
