/**
 * The message system core must stay usable in the Electron main process, so its tests deliberately
 * run in the default Node environment instead of jsdom.
 */
const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
};
