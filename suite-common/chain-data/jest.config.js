module.exports = {
    ...require('../../jest.config.base.swc'),
    // jsdom lacks TextEncoder/TextDecoder, which the network modules reach for at import time.
    setupFiles: ['../../suite-common/test-utils/src/jsdomGlobalPolyfills.js'],
};
