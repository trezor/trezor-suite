const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    transformIgnorePatterns: ['/node_modules/'],
};
