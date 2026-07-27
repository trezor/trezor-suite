const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',

    // The Blockaid client (via @suite-common/tx-simulation) needs its node fetch shim
    // registered before any test module imports it.
    setupFiles: [require('path').resolve(__dirname, '../tx-simulation/src/jestSetup.ts')],
    setupFilesAfterEnv: [require('path').resolve(__dirname, '../../packages/suite/jest.setup.js')],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
    },
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};
