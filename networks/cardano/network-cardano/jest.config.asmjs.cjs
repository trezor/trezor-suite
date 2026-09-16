// Runs the Cardano coin-selection tests against the generated asm.js build of Cardano
// Serialization Lib (generated/csl-asmjs, see scripts/csl-asmjs/generate.js), the build the
// mobile app ships instead of WASM. The SWC transformer is required because Babel cannot
// transform the multi-megabyte asm.js source within a default Node heap.
const baseConfig = require('../../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    displayName: 'asmjs',
    testMatch: ['**/coinSelectionParity.test.ts', '**/coinSelectionScenarios.test.ts'],
    globals: { ...baseConfig.globals, CARDANO_SERIALIZATION_LIB_BUILD: 'generated/csl-asmjs' },
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@emurgo/cardano-serialization-lib-(nodejs|browser)$':
            '<rootDir>/generated/csl-asmjs/cardano_serialization_lib.js',
    },
};
