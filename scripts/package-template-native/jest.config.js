/**
 * Jest configuration for native packages.
 * Keeping this file next to the package.json file instead of providing configuration
 * with `-c ../../jest.config.native` option in package.json scripts
 * allows us to run jest tests directly from IDEs.
 */
const { ...baseConfig } = require('../../jest.config.native');

module.exports = {
    ...baseConfig,
};
