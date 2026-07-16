const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    // The Blockaid client needs its node fetch shim registered before any test module imports it.
    setupFiles: [require('path').resolve(__dirname, 'src/jestSetup.ts')],
};
