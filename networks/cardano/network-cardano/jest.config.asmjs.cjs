/**
 * Runs the unit tests against the asm.js build of Cardano Serialization Lib, the build the
 * mobile app uses instead of WASM. The SWC transformer is required because Babel cannot
 * transform the ~37 MB asm.js source within a default Node heap.
 */
const baseConfig = require('../../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testMatch: ['**/coinSelectionParity.test.ts'],
    globals: { ...baseConfig.globals, CARDANO_SERIALIZATION_LIB_BUILD: 'asmjs' },
    transformIgnorePatterns: ['node_modules/(?!@emurgo/cardano-serialization-lib-asmjs/)'],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@emurgo/cardano-serialization-lib-(nodejs|browser)$':
            '@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js',
    },
};
