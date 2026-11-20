const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    setupFiles: ['../test-utils/src/jsdomGlobalPolyfills.js'],
};
