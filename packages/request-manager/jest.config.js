const baseConfig = require('../../jest.config.base.js');

module.exports = {
    ...baseConfig,
    testRetryTimes: 3,
};
