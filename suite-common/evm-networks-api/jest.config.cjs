const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    // jsdom lacks TextEncoder/TextDecoder, which `@suite-common/test-utils` reaches for at import
    // time through the network modules.
    setupFiles: ['../../suite-common/test-utils/src/jsdomGlobalPolyfills.js'],
};
