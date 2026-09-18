// Used by scripts/csl-asmjs/trace.js only: complete asm.js build with exports wrapped in a recording proxy.
const baseConfig = require('../../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'cjs'],
    testMatch: ['**/coinSelectionParity.test.ts', '**/coinSelectionScenarios.test.ts'],
    globals: {
        ...baseConfig.globals,
        CARDANO_SERIALIZATION_LIB_BUILD: 'cardano-serialization-lib-asmjs',
    },
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^@emurgo/cardano-serialization-lib-(nodejs|browser)$':
            require.resolve('@emurgo/cardano-serialization-lib-asmjs/cardano_serialization_lib.js'),
        '^\\./cardano_serialization_lib\\.asm\\.js$':
            '<rootDir>/scripts/csl-asmjs/traceWasmExports.cjs',
    },
};
