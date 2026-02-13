const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    watchman: false,
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
    },
};
