/**
 * Jest configuration for web packages.
 * Keeping this file next to the package.json file instead of providing configuration
 * with `-c ../../jest.config.base` option in package.json scripts
 * allows us to run jest tests directly from IDEs.
 */
const baseConfig = require('../../../jest.config.base');

// The coin-selection tests run twice: against the WASM build of Cardano Serialization Lib used
// by desktop/web and against the generated asm.js build used by the mobile app.
module.exports = {
    ...baseConfig,
    projects: ['<rootDir>/jest.config.wasm.cjs', '<rootDir>/jest.config.asmjs.cjs'],
};
