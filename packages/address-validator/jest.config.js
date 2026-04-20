const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    transformIgnorePatterns: [
        ...(baseConfig.transformIgnorePatterns ?? []),
        '/node_modules/(?!chai/)',
    ],
};
