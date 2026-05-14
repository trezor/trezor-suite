const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFiles: ['../../suite-common/test-utils/src/jsdomGlobalPolyfills.js'],
};
