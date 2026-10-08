const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
