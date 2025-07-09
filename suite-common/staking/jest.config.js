/**
 * Jest configuration for web packages.
 * Keeping this file next to the package.json file instead of providing configuration
 * with `-c ../../jest.config.base` option in package.json scripts
 * allows us to run jest tests directly from IDEs.
 */
const { ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
};
