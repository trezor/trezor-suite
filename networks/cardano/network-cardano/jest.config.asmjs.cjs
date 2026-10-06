// Coin-selection tests against the generated asm.js build shipped by the mobile app. SWC because
// Babel runs out of heap on the multi-megabyte file.
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
